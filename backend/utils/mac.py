import re

MAC_RE = re.compile(r"^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$")


def normalize_mac(mac: str) -> str:
    if not mac:
        return ""
    mac = mac.strip().upper().replace(".", "").replace(" ", "")
    if re.fullmatch(r"[0-9A-F]{12}", mac):
        return ":".join(mac[i:i+2] for i in range(0, 12, 2))
    return mac.replace("-", ":")


def is_valid_mac(mac: str) -> bool:
    return bool(MAC_RE.fullmatch(mac))
