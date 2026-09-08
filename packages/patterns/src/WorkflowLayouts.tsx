import type { ReactNode } from 'react';
import { AlertBanner, StateView } from '@precision-calm/feedback';
import { FormActions } from '@precision-calm/forms';
import { FormScreen, Page, PageHeader, Section, StickyActionBar } from '@precision-calm/layouts';
import { Card } from '@precision-calm/components';
import { VStack } from '@precision-calm/primitives';
import type { PatternHeaderProps } from './PagePatterns';

const header = ({ title, description, eyebrow, actions }: PatternHeaderProps) => (
  <PageHeader
    title={title}
    {...(description === undefined ? {} : { description })}
    {...(eyebrow === undefined ? {} : { eyebrow })}
    {...(actions === undefined ? {} : { actions })}
  />
);

export interface FormWorkspaceLayoutProps extends PatternHeaderProps {
  children: ReactNode;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode | undefined;
  summary?: ReactNode | undefined;
}

/** Form page plus keyboard-safe persistent actions and shared responsive action order. */
export function FormWorkspaceLayout({ children, primaryAction, secondaryAction, summary, ...head }: FormWorkspaceLayoutProps) {
  return (
    <FormScreen footer={<StickyActionBar><FormActions primary={primaryAction} secondary={secondaryAction} /></StickyActionBar>}>
      <Page width="form" header={header(head)}>
        {summary ? <Section>{summary}</Section> : null}
        <Section>{children}</Section>
      </Page>
    </FormScreen>
  );
}

export interface ReviewWorkflowLayoutProps extends PatternHeaderProps {
  review: ReactNode;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode | undefined;
  status?: ReactNode | undefined;
}

export function ReviewWorkflowLayout({ review, primaryAction, secondaryAction, status, ...head }: ReviewWorkflowLayoutProps) {
  return (
    <FormScreen footer={<StickyActionBar><FormActions primary={primaryAction} secondary={secondaryAction} /></StickyActionBar>}>
      <Page width="form" header={header(head)}>
        {status ? <Section>{status}</Section> : null}
        <Section><Card variant="elevated">{review}</Card></Section>
      </Page>
    </FormScreen>
  );
}

export interface ImportWorkflowLayoutProps extends PatternHeaderProps {
  acquisition: ReactNode;
  status?: ReactNode | undefined;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode | undefined;
}

export function ImportWorkflowLayout({ acquisition, status, primaryAction, secondaryAction, ...head }: ImportWorkflowLayoutProps) {
  return (
    <FormScreen footer={<StickyActionBar><FormActions primary={primaryAction} secondary={secondaryAction} /></StickyActionBar>}>
      <Page width="form" header={header(head)}>
        <Section><Card variant="elevated">{acquisition}</Card></Section>
        {status ? <Section>{status}</Section> : null}
      </Page>
    </FormScreen>
  );
}

export interface CompletionLayoutProps extends PatternHeaderProps {
  message: string;
  primaryAction: ReactNode;
  secondaryAction?: ReactNode | undefined;
  details?: ReactNode | undefined;
}

export function CompletionLayout({ message, primaryAction, secondaryAction, details, ...head }: CompletionLayoutProps) {
  return (
    <Page width="form" header={header(head)}>
      <Section>
        <Card variant="elevated"><VStack gap="lg"><AlertBanner tone="positive" title="Completed" message={message} />{details}</VStack></Card>
      </Section>
      <Section><FormActions primary={primaryAction} secondary={secondaryAction} /></Section>
    </Page>
  );
}

export interface PermissionRationaleLayoutProps extends PatternHeaderProps {
  message?: string | undefined;
  primaryAction?: ReactNode | undefined;
  secondaryAction?: ReactNode | undefined;
}

export function PermissionRationaleLayout({ message, primaryAction, secondaryAction, ...head }: PermissionRationaleLayoutProps) {
  return (
    <Page width="form" header={header(head)}>
      <Section><Card variant="subtle"><StateView kind="permission" {...(message === undefined ? {} : { message })} /></Card></Section>
      {primaryAction ? <Section><FormActions primary={primaryAction} secondary={secondaryAction} /></Section> : null}
    </Page>
  );
}

export interface OfflineWorkspaceLayoutProps extends PatternHeaderProps {
  children: ReactNode;
  banner?: ReactNode | undefined;
}

/** Places an offline/stale-data status before retained content without claiming offline writes. */
export function OfflineWorkspaceLayout({ children, banner = <AlertBanner tone="warning" title="Offline" message="Showing available information. Changes may not be current." />, ...head }: OfflineWorkspaceLayoutProps) {
  return <Page width="dashboard" header={header(head)}><Section>{banner}</Section><Section>{children}</Section></Page>;
}
