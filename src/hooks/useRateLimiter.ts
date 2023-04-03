import { useState, useEffect } from "react";

const useRateLimiter = (maxRequests: number, duration: number) => {
  const [remainingRequests, setRemainingRequests] =
    useState<number>(maxRequests);

  useEffect(() => {
    const storageRemainingRequests = Number(
      localStorage.getItem("remainingRequests") || maxRequests
    );
    const lastRequestTimestamp = Number(
      localStorage.getItem("lastRequestTimestamp")
    );

    if (Date.now() - lastRequestTimestamp > duration) {
      localStorage.setItem("remainingRequests", maxRequests.toString());
      setRemainingRequests(maxRequests);
    } else {
      setRemainingRequests(storageRemainingRequests);
    }
  }, [maxRequests, duration]);

  const decrementRemainingRequests = () => {
    const updatedRemainingRequests = remainingRequests - 1;
    localStorage.setItem(
      "remainingRequests",
      updatedRemainingRequests.toString()
    );
    localStorage.setItem("lastRequestTimestamp", Date.now().toString());
    setRemainingRequests(updatedRemainingRequests);
  };

  return { remainingRequests, decrementRemainingRequests };
};

export default useRateLimiter;
