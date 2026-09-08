import { Linking } from 'react-native';
import * as Camera from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { PrecisionCapabilityAvailability, PrecisionCapabilityResult, PrecisionPermissionAdapter, PrecisionPermissionSnapshot } from '@precision-calm/capabilities';
import type { PrecisionAcquiredResource, PrecisionDocumentPicker, PrecisionDocumentPickOptions, PrecisionMediaAcquisition, PrecisionMediaPickOptions } from './contracts';

interface ExpoPermissionResponse { granted: boolean; canAskAgain: boolean; status: string; }

class ExpoPermissionAdapter implements PrecisionPermissionAdapter {
  readonly #getPermission: () => Promise<ExpoPermissionResponse>;
  readonly #requestPermission: () => Promise<ExpoPermissionResponse>;
  constructor(getPermission: () => Promise<ExpoPermissionResponse>, requestPermission: () => Promise<ExpoPermissionResponse>) {
    this.#getPermission = getPermission;
    this.#requestPermission = requestPermission;
  }
  async get(): Promise<PrecisionPermissionSnapshot> { try { return normalizePermission(await this.#getPermission()); } catch { return unavailablePermission(); } }
  async request(): Promise<PrecisionPermissionSnapshot> { try { return normalizePermission(await this.#requestPermission()); } catch { return unavailablePermission(); } }
  async openSettings(): Promise<PrecisionCapabilityResult<undefined>> {
    try { await Linking.openSettings(); return { status: 'success', value: undefined }; }
    catch { return { status: 'unavailable', reason: 'unsupported' }; }
  }
}

export class ExpoDocumentPicker implements PrecisionDocumentPicker {
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async pick(options: PrecisionDocumentPickOptions = {}): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> {
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

export class ExpoMediaAcquisition implements PrecisionMediaAcquisition {
  readonly libraryPermission = new ExpoPermissionAdapter(ImagePicker.getMediaLibraryPermissionsAsync, ImagePicker.requestMediaLibraryPermissionsAsync);
  readonly cameraPermission = new ExpoPermissionAdapter(Camera.Camera.getCameraPermissionsAsync, Camera.Camera.requestCameraPermissionsAsync);
  async availability(): Promise<PrecisionCapabilityAvailability> { return { status: 'available' }; }
  async pickFromLibrary(options: PrecisionMediaPickOptions = {}): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync(toImagePickerOptions(options));
      return result.canceled ? { status: 'cancelled' } : { status: 'success', value: result.assets.map(toResource) };
    } catch { return { status: 'error', code: 'media_library_pick_failed' }; }
  }
  async captureWithCamera(options: Omit<PrecisionMediaPickOptions, 'multiple'> = {}): Promise<PrecisionCapabilityResult<readonly PrecisionAcquiredResource[]>> {
    try {
      const result = await ImagePicker.launchCameraAsync(toImagePickerOptions(options));
      return result.canceled ? { status: 'cancelled' } : { status: 'success', value: result.assets.map(toResource) };
    } catch { return { status: 'error', code: 'camera_capture_failed' }; }
  }
}

function unavailablePermission(): PrecisionPermissionSnapshot { return { status: 'unavailable', canAskAgain: false, canOpenSettings: false }; }
function normalizePermission(response: ExpoPermissionResponse): PrecisionPermissionSnapshot {
  const status = response.granted ? 'granted' : response.status === 'denied' ? 'denied' : response.status === 'undetermined' ? 'undetermined' : 'restricted';
  return { status, canAskAgain: response.canAskAgain, canOpenSettings: !response.granted && !response.canAskAgain };
}
function toImagePickerOptions(options: PrecisionMediaPickOptions): ImagePicker.ImagePickerOptions {
  return {
    mediaTypes: options.mediaTypes?.map((type) => type === 'image' ? 'images' : 'videos') ?? ['images', 'videos'],
    allowsMultipleSelection: options.multiple ?? false,
    allowsEditing: options.allowsEditing ?? false,
  };
}
function toResource(asset: ImagePicker.ImagePickerAsset): PrecisionAcquiredResource {
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
