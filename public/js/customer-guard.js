(async () => {
    try {
        const response = await fetch("/api/users/me", { credentials: "same-origin" });
        const data = await response.json();
        if (data.user) return;
        const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.replace(`/account.html?next=${encodeURIComponent(next || "/")}`);
    } catch (error) {
        console.error("Customer session check failed:", error);
        window.location.replace(`/account.html?next=${encodeURIComponent(window.location.pathname || "/")}`);
    }
})();
