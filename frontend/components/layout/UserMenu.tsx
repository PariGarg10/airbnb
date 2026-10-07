"use client";

import {
  CircleHelp,
  CircleUser,
  Heart,
  Luggage,
  MessageCircle,
  Users,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { Divider } from "@/components/ui/Divider";

interface UserMenuProps {
  isHost: boolean;
  onClose: () => void;
  onSwitchUser: () => void;
  /** `above` opens the menu upward from the mobile bottom bar. */
  placement?: "below" | "above";
}

function itemClass(bold: boolean): string {
  return `flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-soft ${bold ? "t-menu-item-strong" : "t-menu-item"}`;
}

export function UserMenu({ isHost, onClose, onSwitchUser, placement = "below" }: UserMenuProps) {
  return (
    <div className={`dropdown-pop absolute right-0 z-50 w-[240px] ${placement === "above" ? "bottom-full mb-2" : "top-full mt-2"} overflow-hidden rounded-2xl bg-white py-2 shadow-popover`}>
      <nav aria-label="Account">
        <Link href="/trips" className={itemClass(true)} onClick={onClose}>
          <Luggage size={18} />
          Trips
        </Link>
        <Link href="/wishlists" className={itemClass(true)} onClick={onClose}>
          <Heart size={18} />
          Wishlists
        </Link>
        {isHost ? (
          <Link href="/host/listings" className={itemClass(true)} onClick={onClose}>
            <Building2 size={18} />
            Manage listings
          </Link>
        ) : null}
        <Divider className="my-2" />
        <button type="button" className={itemClass(false)} onClick={onSwitchUser}>
          <Users size={18} />
          Switch user
        </button>
        <Link href="/messages" className={itemClass(false)} onClick={onClose}>
          <MessageCircle size={18} />
          Messages
        </Link>
        <Link href="/coming-soon" className={itemClass(false)} onClick={onClose}>
          <CircleUser size={18} />
          Account
        </Link>
        <Link href="/coming-soon" className={itemClass(false)} onClick={onClose}>
          <CircleHelp size={18} />
          Help
        </Link>
      </nav>
    </div>
  );
}
