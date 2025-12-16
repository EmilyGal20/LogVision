// components/PageLoader.jsx
import { motion } from "framer-motion";

export default function PageLoader({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{ height: "100%" }}
        >
            {children}
        </motion.div>
    );
}
