import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Icon from "./Icon.svelte";

describe("Icon", () => {
    it("renders an svg with default size", () => {
        render(Icon, { props: { path: "M0 0h24v24H0z" } });
        const svg = document.querySelector("svg");
        expect(svg).toBeTruthy();
        expect(svg.getAttribute("width")).toBe("24");
        expect(svg.getAttribute("height")).toBe("24");
    });

    it("accepts custom size", () => {
        render(Icon, { props: { path: "M0 0", size: "32" } });
        const svg = document.querySelector("svg");
        expect(svg.getAttribute("width")).toBe("32");
        expect(svg.getAttribute("height")).toBe("32");
    });

    it("applies className to svg", () => {
        render(Icon, { props: { path: "M0 0", className: "custom-class" } });
        const svg = document.querySelector("svg");
        expect(svg.classList.contains("custom-class")).toBe(true);
    });

    it("renders path d from path prop", () => {
        const d = "M10 10L14 14";
        render(Icon, { props: { path: d } });
        const pathEl = document.querySelector("svg path");
        expect(pathEl).toBeTruthy();
        expect(pathEl.getAttribute("d")).toBe(d);
    });
});
