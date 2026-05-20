import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getLabel } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getLabel unit tests ---

test("getLabel: str_replace_editor create", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating /App.jsx");
});

test("getLabel: str_replace_editor str_replace", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing /components/Card.jsx");
});

test("getLabel: str_replace_editor insert", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "/components/Card.jsx" })).toBe("Editing /components/Card.jsx");
});

test("getLabel: str_replace_editor view", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Viewing /App.jsx");
});

test("getLabel: file_manager rename with new_path", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })).toBe("Renaming /old.jsx → /new.jsx");
});

test("getLabel: file_manager rename without new_path", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/old.jsx" })).toBe("Renaming /old.jsx");
});

test("getLabel: file_manager delete", () => {
  expect(getLabel("file_manager", { command: "delete", path: "/old.jsx" })).toBe("Deleting /old.jsx");
});

test("getLabel: unknown tool falls back to tool name", () => {
  expect(getLabel("some_other_tool", { command: "do_thing" })).toBe("some_other_tool");
});

test("getLabel: missing args falls back to tool name", () => {
  expect(getLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

// --- ToolCallBadge rendering tests ---

test("ToolCallBadge renders label for create command", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  };

  render(<ToolCallBadge toolInvocation={invocation} />);
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("ToolCallBadge renders label for str_replace command", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/components/Card.jsx" },
  };

  render(<ToolCallBadge toolInvocation={invocation} />);
  expect(screen.getByText("Editing /components/Card.jsx")).toBeDefined();
});

test("ToolCallBadge renders label for file_manager rename", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
  };

  render(<ToolCallBadge toolInvocation={invocation} />);
  expect(screen.getByText("Renaming /old.jsx → /new.jsx")).toBeDefined();
});

test("ToolCallBadge shows spinner when in progress", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
  };

  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows green dot when completed", () => {
  const invocation = {
    state: "result",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    result: "File created: /App.jsx",
  } as ToolInvocation;

  const { container } = render(<ToolCallBadge toolInvocation={invocation} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge falls back to tool name for unknown tool", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "1",
    toolName: "unknown_tool",
    args: {},
  };

  render(<ToolCallBadge toolInvocation={invocation} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});
