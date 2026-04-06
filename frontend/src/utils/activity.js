export const ACTIVITY_KEY = "lv-activity";

export function pushActivity(entry) {
    try {
        const raw = localStorage.getItem(ACTIVITY_KEY);
        const list = raw ? JSON.parse(raw) : [];
        const next = [
            {
                id: Date.now(),
                ts: Date.now(),
                ...entry,
            },
            ...list,
        ].slice(0, 20);
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
        return next;
    } catch {
        return [];
    }
}

export function readActivity() {
    try {
        const raw = localStorage.getItem(ACTIVITY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}
