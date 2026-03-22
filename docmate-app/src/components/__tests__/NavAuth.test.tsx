import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavAuth } from "@/components/NavAuth";

vi.mock("next/link", () => ({
    default: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const mockUseAuth = vi.fn();
vi.mock("@/components/AuthProvider", () => ({
    useAuth: () => mockUseAuth(),
}));

describe("NavAuth", () => {
    it("should render loading placeholder when loading", () => {
        mockUseAuth.mockReturnValue({ user: null, loading: true });
        const { container } = render(<NavAuth />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should render Вход link when not authenticated", () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false });
        render(<NavAuth />);
        expect(screen.getByText("Вход")).toBeInTheDocument();
        expect(screen.getByText("Вход")).toHaveAttribute("href", "/login");
    });

    it("should render Регистрация link when not authenticated", () => {
        mockUseAuth.mockReturnValue({ user: null, loading: false });
        render(<NavAuth />);
        expect(screen.getByText("Регистрация")).toBeInTheDocument();
        expect(screen.getByText("Регистрация")).toHaveAttribute(
            "href",
            "/register",
        );
    });

    it("should render Резервации link for patient", () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: "1",
                name: "Иван Петров",
                email: "t@t.com",
                role: "patient",
            },
            loading: false,
        });
        render(<NavAuth />);
        expect(screen.getByText("Резервации")).toBeInTheDocument();
        expect(screen.getByText("Резервации")).toHaveAttribute(
            "href",
            "/bookings",
        );
    });

    it("should render Табло link for doctor", () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: "1",
                name: "Д-р Мария Иванова",
                email: "t@t.com",
                role: "doctor",
            },
            loading: false,
        });
        render(<NavAuth />);
        expect(screen.getByText("Табло")).toBeInTheDocument();
        expect(screen.getByText("Табло")).toHaveAttribute("href", "/dashboard");
    });

    it("should render profile link to /profile", () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: "1",
                name: "Иван Петров",
                email: "t@t.com",
                role: "patient",
            },
            loading: false,
        });
        render(<NavAuth />);
        const profileLink = screen.getByRole("link", { name: /Иван/i });
        expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("should display first name of user", () => {
        mockUseAuth.mockReturnValue({
            user: {
                id: "1",
                name: "Иван Петров",
                email: "t@t.com",
                role: "patient",
            },
            loading: false,
        });
        render(<NavAuth />);
        expect(screen.getByText("Иван")).toBeInTheDocument();
    });
});
