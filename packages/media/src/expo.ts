import { Linking } from 'react-native';
import * as Camera from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { ExpoBaseCapabilityAvailability, ExpoBaseCapabilityResult, ExpoBasePermissionAdapter, ExpoBasePermissionSnapshot } from '@expo-base/capabilities';
import type { ExpoBaseAcquiredResource, ExpoBaseDocumentPicker, ExpoBaseDocumentPickOptions, ExpoBaseMediaAcquisition, ExpoBaseMediaPickOptions } from './contracts';

interface ExpoPermissionResponse { granted: boolean; canAskAgain: boolean; status: string; }

class ExpoPermissionAdapter implements ExpoBasePermissionAdapter {
  readonly #getPermission: () => Promise<ExpoPermissionResponse>;
  readonly #requestPermission: () => Promise<ExpoPermissionResponse>;
  constructor(getPermission: () => Promise<ExpoPermissionResponse>, requestPermission: () => Promise<ExpoPermissionResponse>) {
    this.#getPermission = getPermission;
    this.#requestPermission = requestPermission;
  }
  async get(): Promise<ExpoBasePermissionSnapshot> { try { return normalizePermission(await this.#getPermission()); } catch { return unavailablePermission(); } }
  async request(): Promise<ExpoBasePermissionSnapshot> { try { return normalizePermission(await this.#requestPermission()); } catch { return unavailablePermission(); } }
  async openSettings(): Promise<ExpoBaseCapabilityResult<undefined>> {
    try { await Linking.openSettings(); return { status: 'success', value: undefined }; }
    catch { return { status: 'unavailable', reason: 'unsupported' }; }
  }
}

export class ExpoDocumentPicker implements ExpoBaseDocumentPicker {
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  async pick(options: ExpoBaseDocumentPickOptions = {}): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: options.mimeTypes?.length ? [...options.mimeTypes] : '*/*',
        multiple: options.multiple ?? false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return { status: 'cancelled' };
      return { status: 'success', value: result.assets.map((asset) => ({ uri: asset.uri, name: asset.name ?? null, mimeType: asset.mimeType ?? null, size: asset.size ?? null, kind: 'document' })) };
    } catch { return { status: 'error', code: 'document_pick_failed' }; }
  }
}

export class ExpoMediaAcquisition implements ExpoBaseMediaAcquisition {
  readonly libraryPermission = new ExpoPermissionAdapter(ImagePicker.getMediaLibraryPermissionsAsync, ImagePicker.requestMediaLibraryPermissionsAsync);
  readonly cameraPermission = new ExpoPermissionAdapter(Camera.Camera.getCameraPermissionsAsync, Camera.Camera.requestCameraPermissionsAsync);
  async availability(): Promise<ExpoBaseCapabilityAvailability> { return { status: 'available' }; }
  async pickFromLibrary(options: ExpoBaseMediaPickOptions = {}): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(toImagePickerOptions(options));
      return result.canceled ? { status: 'cancelled' } : { status: 'success', value: result.assets.map(toResource) };
    } catch { return { status: 'error', code: 'media_library_pick_failed' }; }
  }
  async captureWithCamera(options: Omit<ExpoBaseMediaPickOptions, 'multiple'> = {}): Promise<ExpoBaseCapabilityResult<readonly ExpoBaseAcquiredResource[]>> {
    try {
      const result = await ImagePicker.launchCameraAsync(toImagePickerOptions(options));
      return result.canceled ? { status: 'cancelled' } : { status: 'success', value: result.assets.map(toResource) };
    } catch { return { status: 'error', code: 'camera_capture_failed' }; }
  }
}

function unavailablePermission(): ExpoBasePermissionSnapshot { return { status: 'unavailable', canAskAgain: false, canOpenSettings: false }; }
function normalizePermission(response: ExpoPermissionResponse): ExpoBasePermissionSnapshot {
  const status = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : response.status === 'undetermined' ? 'undetermined' : 'restricted';
  return { status, canAskAgain: response.canAskAgain, canOpenSettings: !response.granted && !response.canAskAgain };
}
function toImagePickerOptions(options: ExpoBaseMediaPickOptions): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: options.mediaTypes?.map((type) => type === 'image' ? 'images' : 'videos') ?? ['images', 'videos'],
    allowsMultipleSelection: options.multiple ?? false,
    allowsEditing: options.allowsEditing ?? false,
  };
}
function toResource(asset: ImagePicker.ImagePickerAsset): ExpoBaseAcquiredResource {
  return {
    uri: asset.uri,
    name: asset.fileName ?? null,
    mimeType: asset.mimeType ?? null,
    size: asset.fileSize ?? null,
    kind: asset.type === 'video' ? 'video' : 'image',
    width: asset.width,
    height: asset.height,
    ...(asset.duration === null ? {} : { durationMs: asset.duration }),
  };
}
