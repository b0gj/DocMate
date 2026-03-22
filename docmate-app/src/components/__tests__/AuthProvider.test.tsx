import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";

beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
});

function TestConsumer() {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading</div>;
    if (user) return <div>User: {user.name}</div>;
    return <div>No user</div>;
}

function LoginTestConsumer() {
    const { login } = useAuth();
    return <button onClick={() => login("t@t.com", "123456")}>Login</button>;
}

function RegisterTestConsumer() {
    const { register } = useAuth();
    return (
        <button
            onClick={() =>
                register({
                    email: "t@t.com",
                    password: "123456",
                    name: "Test",
                    role: "patient",
                })
            }
        >
            Register
        </button>
    );
}

function LogoutTestConsumer() {
    const { logout, user } = useAuth();
    return (
        <>
            {user && <div>User: {user.name}</div>}
            <button onClick={logout}>Logout</button>
        </>
    );
}

describe("AuthProvider", () => {
    it("should fetch /api/auth/me on mount", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: "Not authenticated" }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith("/api/auth/me");
        });
    });

    it("should set user when API returns user data", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    user: {
                        _id: "1",
                        email: "t@t.com",
                        name: "Иван",
                        role: "patient",
                    },
                }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText("User: Иван")).toBeInTheDocument();
        });
    });

    it("should set user to null when API returns error", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ error: "Not authenticated" }),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText("No user")).toBeInTheDocument();
        });
    });

    it("should set loading to false after fetch completes", async () => {
        (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({}),
        });

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>,
        );

        // Initially loading
        expect(screen.getByText("Loading")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("No user")).toBeInTheDocument();
        });
    });

    it("should call POST /api/auth/login on login", async () => {
        // Initial me call
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({}),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        user: {
                            id: "1",
                            email: "t@t.com",
                            name: "Test",
                            role: "patient",
                        },
                    }),
            });

        render(
            <AuthProvider>
                <LoginTestConsumer />
            </AuthProvider>,
        );

        await waitFor(() =>
            expect(screen.getByText("Login")).toBeInTheDocument(),
        );

        await act(async () => {
            screen.getByText("Login").click();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/login",
            expect.objectContaining({
                method: "POST",
            }),
        );
    });

    it("should call POST /api/auth/register on register", async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({}),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        user: {
                            id: "1",
                            email: "t@t.com",
                            name: "Test",
                            role: "patient",
                        },
                    }),
            });

        render(
            <AuthProvider>
                <RegisterTestConsumer />
            </AuthProvider>,
        );

        await waitFor(() =>
            expect(screen.getByText("Register")).toBeInTheDocument(),
        );

        await act(async () => {
            screen.getByText("Register").click();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/register",
            expect.objectContaining({
                method: "POST",
            }),
        );
    });

    it("should call POST /api/auth/logout and clear user on logout", async () => {
        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        user: {
                            _id: "1",
                            email: "t@t.com",
                            name: "Test",
                            role: "patient",
                        },
                    }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            });

        render(
            <AuthProvider>
                <LogoutTestConsumer />
            </AuthProvider>,
        );

        await waitFor(() =>
            expect(screen.getByText("User: Test")).toBeInTheDocument(),
        );

        await act(async () => {
            screen.getByText("Logout").click();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "/api/auth/logout",
            expect.objectContaining({
                method: "POST",
            }),
        );
    });

    it("should throw error when useAuth is used outside AuthProvider", () => {
        // Suppress console.error for expected error
        const spy = vi.spyOn(console, "error").mockImplementation(() => {});
        expect(() => render(<TestConsumer />)).toThrow(
            "useAuth must be used within an AuthProvider",
        );
        spy.mockRestore();
    });
});
