import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "./storeContext";

const RIDE_KEY = "tirana-ride-active";

const readSavedRide = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(RIDE_KEY) || "null");
        return saved && Number.isInteger(saved.rideId) && typeof saved.accessCode === "string" ? saved : null;
    } catch {
        return null;
    }
};

const StoreContextProvider = ({ children }) => {
    const url = import.meta.env.VITE_API_URL || "http://localhost:4000";
    const [settings, setSettings] = useState(null);
    const [fares, setFares] = useState([]);
    const [promos, setPromos] = useState([]);
    const [activeRide, setActiveRideState] = useState(readSavedRide);
    const [errorMessage, setErrorMessage] = useState("");
    const [promoRefresh, setPromoRefresh] = useState(0);

    const setActiveRide = useCallback((ride) => {
        try {
            if (ride) localStorage.setItem(RIDE_KEY, JSON.stringify(ride));
            else localStorage.removeItem(RIDE_KEY);
        } catch {
            // localStorage mund të jetë i bllokuar — porosia vazhdon të punojë në këtë sesion
        }
        setActiveRideState(ride);
    }, []);

    useEffect(() => {
        axios.get(`${url}/api/settings/public`)
            .then((response) => {
                if (!response.data.success) throw new Error(response.data.message);
                setSettings(response.data.data);
            })
            .catch((error) => setErrorMessage(error.response?.data?.message || "Nuk mund të lidhemi me serverin. Provo përsëri pas pak."));
        axios.get(`${url}/api/fare/list`)
            .then((response) => {
                if (!response.data.success) throw new Error(response.data.message);
                setFares(response.data.data);
            })
            .catch(() => {});
    }, [url]);

    // Ofertat e kthimit rifreskohen çdo 20 sekonda
    useEffect(() => {
        let active = true;
        const load = () => axios.get(`${url}/api/promo/active`)
            .then((response) => { if (active && response.data.success) setPromos(response.data.data); })
            .catch(() => {});
        load();
        const timer = setInterval(load, 20000);
        return () => { active = false; clearInterval(timer); };
    }, [url, promoRefresh]);

    const refreshPromos = useCallback(() => setPromoRefresh((value) => value + 1), []);

    return (
        <StoreContext.Provider value={{
            url, settings, fares, promos, refreshPromos,
            activeRide, setActiveRide,
            errorMessage, setErrorMessage,
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;
