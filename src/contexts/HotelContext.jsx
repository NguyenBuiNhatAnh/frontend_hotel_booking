// contexts/HotelContext.jsx

import { createContext, useContext, useState } from "react";

const HotelContext = createContext();

export const HotelProvider = ({ children }) => {

  const [hotelBooking, setHotelBooking] = useState({
    hotelId: "",
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
  });

  // update từng field
  const updateHotelBooking = (data) => {
    setHotelBooking((prev) => ({
      ...prev,
      ...data,
    }));
  };

  // reset
  const resetHotelBooking = () => {
    setHotelBooking({
      hotelId: "",
      checkInDate: "",
      checkOutDate: "",
      guests: 1,
    });
  };

  return (
    <HotelContext.Provider
      value={{
        hotelBooking,
        updateHotelBooking,
        resetHotelBooking,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  return useContext(HotelContext);
};