import { usePrecisionRouter } from '@precision-calm/navigation-router';
import { Page, PageHeader, ScrollScreen, Section, StateView } from '@precision-calm/ui';

export default function NotFoundScreen() {
  const router = usePrecisionRouter();
  return (
    <ScrollScreen>
      <Page
        width="reading"
        header={<PageHeader eyebrow="PAGE NOT FOUND" title="This destination does not exist" description="The link may be outdated or the address may have been entered incorrectly." />}
      >
        <Section>
          <StateView
            kind="error"
            title="We could not find that page"
            message="Return to the application home to continue safely."
            actionLabel="Return home"
            onAction={() => router.replace('/')}
          />
        </Section>
      </Page>
    </ScrollScreen>
  );
}
