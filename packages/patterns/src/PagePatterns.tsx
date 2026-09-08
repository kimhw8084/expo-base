import type { ReactNode } from 'react';
import { Page, PageHeader, Section, AdaptiveSplit, MasterDetail, AdaptiveGrid } from '@precision-calm/layouts';
import { Card } from '@precision-calm/components';
import { FormActions } from '@precision-calm/forms';
import { StateView } from '@precision-calm/feedback';
import { Dialog, BottomSheet } from '@precision-calm/overlays';
import { VStack } from '@precision-calm/primitives';

export interface PatternHeaderProps {
  title: string;
  description?: string | undefined;
  eyebrow?: string | undefined;
  actions?: ReactNode | undefined;
}
const header = ({ title, description, eyebrow, actions }: PatternHeaderProps) => <PageHeader title={title} {...(description !== undefined ? { description } : {})} {...(eyebrow !== undefined ? { eyebrow } : {})} {...(actions !== undefined ? { actions } : {})} />;

export interface DashboardLayoutProps extends PatternHeaderProps { metrics:ReactNode; primary:ReactNode; secondary:ReactNode; activity?:ReactNode | undefined; }
export function DashboardLayout({metrics,primary,secondary,activity,...head}:DashboardLayoutProps){return <Page width="dashboard" header={header(head)}><Section>{metrics}</Section><Section><AdaptiveSplit primary={primary} secondary={secondary}/></Section>{activity?<Section>{activity}</Section>:null}</Page>}

export interface FeedListLayoutProps extends PatternHeaderProps { controls?:ReactNode | undefined; content:ReactNode; footer?:ReactNode | undefined; }
export function FeedListLayout({controls,content,footer,...head}:FeedListLayoutProps){return <Page width="standard" header={header(head)}><Section>{controls}{content}</Section>{footer?<Section>{footer}</Section>:null}</Page>}

export interface SearchResultsLayoutProps extends PatternHeaderProps { summary?:ReactNode | undefined; filters:ReactNode; results:ReactNode; }
export function SearchResultsLayout({summary,filters,results,...head}:SearchResultsLayoutProps){return <Page width="dashboard" header={header(head)}>{summary?<Section>{summary}</Section>:null}<Section><AdaptiveSplit primary={results} secondary={filters} secondaryWidth="minimum" reverseOnCompact/></Section></Page>}

export interface DataWorkspaceLayoutProps extends PatternHeaderProps { controls?:ReactNode | undefined; data:ReactNode; inspector?:ReactNode | undefined; }
export function DataWorkspaceLayout({controls,data,inspector,...head}:DataWorkspaceLayoutProps){return <Page width="wide" header={header(head)}>{controls?<Section>{controls}</Section>:null}<Section>{inspector?<AdaptiveSplit primary={data} secondary={inspector} secondaryWidth="standard"/>:data}</Section></Page>}

export interface DetailLayoutProps extends PatternHeaderProps { hero?:ReactNode | undefined; details:ReactNode; aside?:ReactNode | undefined; }
export function DetailLayout({hero,details,aside,...head}:DetailLayoutProps){return <Page width="standard" header={header(head)}>{hero?<Section>{hero}</Section>:null}<Section>{aside?<AdaptiveSplit primary={details} secondary={aside}/>:details}</Section></Page>}

export interface MasterDetailPageLayoutProps extends PatternHeaderProps { master:ReactNode; detail:ReactNode; compactMode?:'master'|'detail'|'stack' | undefined; }
export function MasterDetailPageLayout({master,detail,compactMode='master',...head}:MasterDetailPageLayoutProps){return <Page width="dashboard" header={header(head)}><Section><MasterDetail master={master} detail={detail} compactMode={compactMode}/></Section></Page>}

export interface CreateEditFormLayoutProps extends PatternHeaderProps { form:ReactNode; primaryAction:ReactNode; secondaryAction?:ReactNode | undefined; }
export function CreateEditFormLayout({form,primaryAction,secondaryAction,...head}:CreateEditFormLayoutProps){return <Page width="form" header={header(head)}><Section>{form}<FormActions primary={primaryAction} secondary={secondaryAction}/></Section></Page>}

export interface WizardLayoutProps extends PatternHeaderProps { progress:ReactNode; step:ReactNode; primaryAction:ReactNode; secondaryAction?:ReactNode | undefined; }
export function WizardLayout({progress,step,primaryAction,secondaryAction,...head}:WizardLayoutProps){return <Page width="form" header={header(head)}><Section>{progress}</Section><Section>{step}<FormActions primary={primaryAction} secondary={secondaryAction}/></Section></Page>}

export interface SettingsLayoutProps extends PatternHeaderProps { navigation:ReactNode; content:ReactNode; }
export function SettingsLayout({navigation,content,...head}:SettingsLayoutProps){return <Page width="dashboard" header={header(head)}><Section><MasterDetail master={navigation} detail={content} compactMode="stack" masterWidth="narrow"/></Section></Page>}

export interface ProfileLayoutProps extends PatternHeaderProps { summary:ReactNode; sections:readonly ReactNode[]; }
export function ProfileLayout({summary,sections,...head}:ProfileLayoutProps){return <Page width="standard" header={header(head)}><Section>{summary}</Section>{sections.map((section,index)=><Section key={index}>{section}</Section>)}</Page>}

export interface AuthenticationLayoutProps { brand?:ReactNode | undefined; title:string; description?:string | undefined; form:ReactNode; footer?:ReactNode | undefined; }
export function AuthenticationLayout({brand,title,description,form,footer}:AuthenticationLayoutProps){return <Page width="form"><Section><VStack gap="xl" align="stretch">{brand}<PageHeader title={title} {...(description !== undefined ? { description } : {})} /><Card variant="elevated">{form}</Card>{footer}</VStack></Section></Page>}

export interface AnalyticsLayoutProps extends PatternHeaderProps { metrics:ReactNode; primaryChart:ReactNode; secondaryVisuals?:ReactNode | undefined; insights?:ReactNode | undefined; }
export function AnalyticsLayout({metrics,primaryChart,secondaryVisuals,insights,...head}:AnalyticsLayoutProps){const visuals=<VStack gap="lg">{primaryChart}{secondaryVisuals}</VStack>;return <Page width="dashboard" header={header(head)}><Section>{metrics}</Section><Section>{insights?<AdaptiveSplit primary={visuals} secondary={insights}/>:visuals}</Section></Page>}

export interface EmptyStartLayoutProps extends PatternHeaderProps { emptyTitle:string; emptyMessage:string; actionLabel:string; onAction:()=>void; secondaryLabel?:string | undefined; onSecondary?:(()=>void) | undefined; }
export function EmptyStartLayout({emptyTitle,emptyMessage,actionLabel,onAction,secondaryLabel,onSecondary,...head}:EmptyStartLayoutProps){return <Page width="standard" header={header(head)}><Section><Card variant="subtle"><StateView kind="empty" title={emptyTitle} message={emptyMessage} actionLabel={actionLabel} onAction={onAction} secondaryLabel={secondaryLabel} onSecondary={onSecondary}/></Card></Section></Page>}

export interface FullScreenWorkflowLayoutProps extends PatternHeaderProps { content:ReactNode; primaryAction:ReactNode; secondaryAction?:ReactNode | undefined; status?:ReactNode | undefined; }
export function FullScreenWorkflowLayout({content,primaryAction,secondaryAction,status,...head}:FullScreenWorkflowLayoutProps){return <Page width="standard" header={header(head)}>{status?<Section>{status}</Section>:null}<Section>{content}</Section><Section><FormActions primary={primaryAction} secondary={secondaryAction}/></Section></Page>}

export interface OverlayWorkflowLayoutProps extends PatternHeaderProps { base:ReactNode; open:boolean; onOpenChange:(open:boolean)=>void; presentation:'dialog'|'sheet'; overlayTitle:string; overlayDescription?:string | undefined; overlayContent:ReactNode; overlayActions?:ReactNode | undefined; }
export function OverlayWorkflowLayout({base,open,onOpenChange,presentation,overlayTitle,overlayDescription,overlayContent,overlayActions,...head}:OverlayWorkflowLayoutProps){return <Page width="standard" header={header(head)}><Section>{base}</Section>{presentation==='dialog'?<Dialog open={open} onOpenChange={onOpenChange} title={overlayTitle} description={overlayDescription} actions={overlayActions}>{overlayContent}</Dialog>:<BottomSheet open={open} onOpenChange={onOpenChange} title={overlayTitle}>{overlayContent}{overlayActions}</BottomSheet>}</Page>}
