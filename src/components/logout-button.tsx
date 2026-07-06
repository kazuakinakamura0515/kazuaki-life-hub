"use client";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton(){async function logout(){const supabase=createClient();if(supabase)await supabase.auth.signOut();window.location.assign("/login")}return <button className="logout-button" onClick={logout}><LogOut size={15}/>ログアウト</button>}
