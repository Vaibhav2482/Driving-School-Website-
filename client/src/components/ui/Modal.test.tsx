import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("opens and closes with the `open` prop and is labelled by its title", () => {
    const { rerender } = render(
      <Modal open={false} onClose={() => {}} title="Edit package">
        Body
      </Modal>,
    );
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");

    rerender(
      <Modal open onClose={() => {}} title="Edit package">
        Body
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Edit package" })).toBeInTheDocument();
  });

  it("calls onClose from the close button", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Edit package" />);
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ConfirmDialog", () => {
  it("wires confirm and cancel and blocks both while loading", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog
        open
        title="Delete?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledOnce();

    rerender(
      <ConfirmDialog
        open
        loading
        title="Delete?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
