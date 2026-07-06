"use client";
import { useEffect } from "react";
export function ThemeRegister(){useEffect(()=>{const saved=localStorage.getItem("life-hub-theme")||"system";document.documentElement.dataset.theme=saved},[]);return null}
