import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// The Index component simply redirects to the LexiGrab page
const Index = () => {
  return <Navigate to="/lexigrab" replace />;
};

export default Index;