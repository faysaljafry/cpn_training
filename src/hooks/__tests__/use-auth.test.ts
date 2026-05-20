import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();

vi.mock("@/actions", () => ({
  signIn: (...args: unknown[]) => mockSignInAction(...args),
  signUp: (...args: unknown[]) => mockSignUpAction(...args),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

const mockGetProjects = vi.fn();

vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

const mockCreateProject = vi.fn();

vi.mock("@/actions/create-project", () => ({
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
});

describe("useAuth — initial state", () => {
  test("isLoading starts false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useAuth — signIn", () => {
  test("sets isLoading true during the call and false after", async () => {
    let resolveSignIn!: (v: unknown) => void;
    mockSignInAction.mockReturnValue(new Promise((r) => (resolveSignIn = r)));

    const { result } = renderHook(() => useAuth());

    let signInPromise: Promise<unknown>;
    act(() => {
      signInPromise = result.current.signIn("a@b.com", "password");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn({ success: false, error: "bad" });
      await signInPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("returns the result from the action", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.signIn("a@b.com", "wrong");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  });

  test("does not navigate when sign-in fails", async () => {
    mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("a@b.com", "wrong");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("navigates to existing project after successful sign-in", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "proj-1" }, { id: "proj-2" }]);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-1");
  });

  test("creates a new project and navigates when no projects exist after sign-in", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "new-proj" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/new-proj");
  });

  test("claims anonymous work on sign-in: creates project, clears anon data, navigates", async () => {
    const anonMessages = [{ id: "m1", role: "user", content: "Hello" }];
    const anonData = { "/App.jsx": { type: "file", content: "export default () => <div/>" } };

    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({ messages: anonMessages, fileSystemData: anonData });
    mockCreateProject.mockResolvedValue({ id: "anon-proj" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith({
      name: expect.stringContaining("Design from"),
      messages: anonMessages,
      data: anonData,
    });
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockGetProjects).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/anon-proj");
  });

  test("ignores anon work when messages array is empty", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
    mockGetProjects.mockResolvedValue([{ id: "proj-1" }]);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    expect(mockCreateProject).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/proj-1");
  });
});

describe("useAuth — signUp", () => {
  test("sets isLoading true during the call and false after", async () => {
    let resolveSignUp!: (v: unknown) => void;
    mockSignUpAction.mockReturnValue(new Promise((r) => (resolveSignUp = r)));

    const { result } = renderHook(() => useAuth());

    let signUpPromise: Promise<unknown>;
    act(() => {
      signUpPromise = result.current.signUp("a@b.com", "password");
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignUp({ success: false, error: "bad" });
      await signUpPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  test("returns the result from the action", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());

    let returnValue: unknown;
    await act(async () => {
      returnValue = await result.current.signUp("a@b.com", "password123");
    });

    expect(returnValue).toEqual({ success: false, error: "Email already registered" });
  });

  test("does not navigate when sign-up fails", async () => {
    mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("a@b.com", "password123");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  test("navigates to most recent project after successful sign-up", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "proj-recent" }, { id: "proj-old" }]);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("new@user.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/proj-recent");
  });

  test("creates a new project and navigates when no projects exist after sign-up", async () => {
    mockSignUpAction.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "brand-new" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("new@user.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({ messages: [], data: {} })
    );
    expect(mockPush).toHaveBeenCalledWith("/brand-new");
  });

  test("claims anonymous work on sign-up", async () => {
    const anonMessages = [{ id: "m1", role: "user", content: "Make a button" }];
    const anonData = { "/App.jsx": { type: "file", content: "export default () => <button/>" } };

    mockSignUpAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue({ messages: anonMessages, fileSystemData: anonData });
    mockCreateProject.mockResolvedValue({ id: "claimed-proj" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp("new@user.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith({
      name: expect.stringContaining("Design from"),
      messages: anonMessages,
      data: anonData,
    });
    expect(mockClearAnonWork).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/claimed-proj");
  });
});

describe("useAuth — new project name", () => {
  test("generated project name contains a random numeric suffix", async () => {
    mockSignInAction.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "x" });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn("a@b.com", "password123");
    });

    const name: string = mockCreateProject.mock.calls[0][0].name;
    expect(name).toMatch(/^New Design #\d+$/);
  });
});
