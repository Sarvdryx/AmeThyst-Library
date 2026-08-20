"use client";

import React, { useState } from 'react';
import RegisterTemplate from '../components/templates/RegisterTemplate';
import { RegisterFormCard } from '../components/organisms';
import { useRedirectIfLoggedIn } from '../utils/user';


const RegisterPage = () => {
  useRedirectIfLoggedIn();

  const [state, setState] = useState({

    isLoading: false,
    error: null as string | null,
    validationErrors: {} as Record<string, string>,
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  return (
    <RegisterTemplate>
        <RegisterFormCard 
            formData={formData}
            setFormData={setFormData}
            state={state}
            setState={setState}
        />
    </RegisterTemplate>
  );
};

export default RegisterPage;
