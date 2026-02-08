import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export const useBusiness = () => {
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBusiness = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_URL}/settings`);
                if (!res.ok) throw new Error("Failed to fetch business settings");
                const data = await res.json();
                setBusiness(data);
            } catch (err) {
                console.error(err);
                toast.error("Unable to load business settings");
            } finally {
                setLoading(false);
            }
        };

        fetchBusiness();
    }, []);

    return { business, loading };
};
