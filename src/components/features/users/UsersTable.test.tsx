import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UsersTable } from "./UsersTable";

describe("UsersTable", () => {
  afterEach(cleanup);

  it("shows only the user list when the role has no action permissions", () => {
    render(
      <UsersTable
        users={[
          {
            id: "u-1",
            name: "Simón Isaza",
            email: "simon@example.com",
            phone: "",
            roleIds: [],
            status: "activo",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        roles={[]}
        actions={{
          view: false,
          manage: false,
          edit: false,
          toggleStatus: false,
          delete: false,
        }}
        onView={vi.fn()}
        onManage={vi.fn()}
        onEdit={vi.fn()}
        onToggleStatus={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Simón Isaza")).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Acciones" })).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
