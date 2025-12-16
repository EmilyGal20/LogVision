// ===============================================
// File: src/components/DeviceSkeleton.jsx
// ===============================================

import { Skeleton, TableRow, TableCell } from "@mui/material";

export default function DeviceSkeleton() {
    return (
        <TableRow>
            <TableCell><Skeleton width={50} /></TableCell>
            <TableCell><Skeleton width={120} /></TableCell>
            <TableCell><Skeleton width={80} /></TableCell>
            <TableCell><Skeleton width={70} /></TableCell>
            <TableCell><Skeleton width={70} /></TableCell>
            <TableCell><Skeleton width={70} /></TableCell>
            <TableCell><Skeleton width={90} /></TableCell>
        </TableRow>
    );
}
