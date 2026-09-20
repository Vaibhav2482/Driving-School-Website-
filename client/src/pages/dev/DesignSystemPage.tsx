import { CalendarDays, Inbox, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Seo } from "@/components/common/Seo";
import { StatCard } from "@/components/common/StatCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { formatInr } from "@/lib/format";
import { DemoForm } from "./DemoForm";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-line pb-2 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const swatches = [
  ["brand-900", "bg-brand-900"],
  ["brand-800", "bg-brand-800"],
  ["brand-500", "bg-brand-500"],
  ["brand-100", "bg-brand-100"],
  ["accent-600", "bg-accent-600"],
  ["accent-500", "bg-accent-500"],
  ["signal-400", "bg-signal-400"],
  ["sand-100", "bg-sand-100"],
  ["sand-300", "bg-sand-300"],
  ["sand-600", "bg-sand-600"],
] as const;

/**
 * DEVELOPMENT ONLY (route exists only in dev builds): a living style guide for the design system.
 * All values shown are labelled examples, not business data.
 */
export function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-10 sm:px-6">
      <Seo title="Design system" noIndex />
      <PageHeader
        eyebrow="Development only"
        title="Design system"
        description="Tokens and components for Sri Sai Balaji Driving School. This page is not part of production builds."
      />

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map(([name, cls]) => (
            <div key={name}>
              <div className={`${cls} h-14 rounded-control border border-line`} />
              <p className="mt-1 text-xs text-muted">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="space-y-2">
          <p className="font-display text-4xl font-semibold">Display heading (Sora)</p>
          <p className="font-display text-2xl font-semibold">Section heading</p>
          <p className="text-base">
            Body text (Inter). Comfortable to read on a phone, at sensible line lengths.
          </p>
          <p className="text-sm text-muted">Muted supporting text for hints and metadata.</p>
          <p className="text-sm">
            Money is formatted from integer paise: {formatInr(500000)} · {formatInr(12550)}
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="accent">Book Your Driving Lesson</Button>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges and alerts">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="success">Paid</Badge>
          <Badge tone="warning">Pending</Badge>
          <Badge tone="danger">Failed</Badge>
          <Badge tone="accent">New</Badge>
        </div>
        <div className="space-y-3">
          <Alert title="Information">Something useful to know.</Alert>
          <Alert variant="success" title="Saved">
            Your changes were saved.
          </Alert>
          <Alert variant="warning" title="Check this">
            This needs your attention.
          </Alert>
          <Alert variant="danger" title="Could not save">
            Please try again.
          </Alert>
        </div>
      </Section>

      <Section title="Cards and stat cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Loading state" isLoading icon={Users} />
          <StatCard label="No data yet" icon={Inbox} hint="Shows a dash, never a made-up number" />
          <StatCard label="With a value" value={0} icon={CalendarDays} />
        </div>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Supporting description</CardDescription>
            </div>
            <Badge tone="brand">Example</Badge>
          </CardHeader>
          <CardContent>Card content sits here.</CardContent>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="Form">
        <Card className="max-w-md">
          <DemoForm />
        </Card>
      </Section>

      <Section title="Table">
        <Table>
          <caption className="sr-only">Example table</caption>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>[DEV] Example row</TableCell>
              <TableCell>
                <Badge tone="success">Active</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Section>

      <Section title="Loading and empty states">
        <div className="flex items-center gap-4">
          <Spinner />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <EmptyState
          icon={Inbox}
          title="No enquiries yet"
          description="When someone submits the enquiry form, it will appear here."
          action={<Button variant="secondary">Example action</Button>}
        />
      </Section>

      <Section title="Modal and confirmation dialog">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Open confirmation
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Example modal"
          description="Built on the native dialog element."
          footer={<Button onClick={() => setModalOpen(false)}>Done</Button>}
        >
          Focus is trapped here, Escape closes it, and focus returns to the button that opened it.
        </Modal>
        <ConfirmDialog
          open={confirmOpen}
          tone="danger"
          title="Delete this example?"
          description="This is only a demonstration; nothing will be deleted."
          confirmLabel="Delete"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
        />
      </Section>
    </div>
  );
}
