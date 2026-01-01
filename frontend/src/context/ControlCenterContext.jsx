import { createContext, useContext, useState } from "react";

const ControlCenterContext = createContext(undefined);

export function ControlCenterProvider({ children }) {
    const [selectedIP, setSelectedIP] = useState(null);

    return (
        <ControlCenterContext.Provider value={{ selectedIP, setSelectedIP }}>
            {children}
        </ControlCenterContext.Provider>
    );
}

export function useControlCenter() {
    const ctx = useContext(ControlCenterContext);
    if (!ctx) {
        throw new Error("useControlCenter must be used within ControlCenterProvider");
    }
    return ctx;
}
