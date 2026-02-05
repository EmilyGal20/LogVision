// // components/PageLoader.jsx
// import { motion } from "framer-motion";

// export default function PageLoader({ children }) {
//     return (
//         <motion.div
//             initial={{ opacity: 0, y: 6 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -6 }}
//             transition={{ duration: 0.25 }}
//             style={{ height: "100%" }}
//         >
//             {children}
//         </motion.div>
//     );
// }

// src/components/PageLoader.jsx
import "./pageLoader.css";
// import logo from "../assets/logVision2.png"; // שימי את הקובץ ב-src/assets

export default function PageLoader({ show }) {
    if (!show) return null;
    return (
        // <div className="lv-loader">
        //     {/* <img className="lv-loader__logo" src={logo} alt="LOG VISION" /> */}

        //     <img
        //         className="lv-loader__logo"
        //         src={`${process.env.PUBLIC_URL}/logVision2.png`}
        //         alt="LOG VISION"
        //     />
        //     <div className="lv-loader__text">Loading…</div>

        <div className={`lv-loader ${show ? "" : "lv-loader--hide"}`}>
            <img
                className="lv-loader__logo"
                src={`${process.env.PUBLIC_URL}/logVision3.png`}
                alt="LOG VISION"
            />
            <div className="lv-loader__text">
                SEE WHAT MATTERS
                <span>MASTER YOUR SYSTEMS</span>
            </div>
        </div>
    );
}
