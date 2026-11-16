import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Ngarkon të dhëna nga API dhe i rifreskon çdo `interval` ms
export function usePolling(url, token, { interval = 8000, refresh = 0, fallback = "Të dhënat nuk u ngarkuan" } = {}) {
    const [data, setData] = useState(null);
    const [meta, setMeta] = useState({});

    useEffect(() => {
        let active = true;
        const load = () => axios.get(url, { headers: { token } })
            .then((response) => {
                if (!response.data.success) throw new Error(response.data.message || fallback);
                if (!active) return;
                const { data: payload, ...rest } = response.data;
                setData(payload);
                setMeta(rest);
            })
            .catch((error) => {
                if (active && ![401, 403].includes(error.response?.status)) toast.error(error.response?.data?.message || error.message || fallback, { toastId: url });
            });
        load();
        const timer = interval ? setInterval(load, interval) : null;
        return () => { active = false; if (timer) clearInterval(timer); };
    }, [url, token, interval, refresh, fallback]);

    return { data, meta };
}
