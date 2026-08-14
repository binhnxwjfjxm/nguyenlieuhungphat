"use client";

import Image from "next/image";
import { UserRound } from "lucide-react";
import { useCustomerAuth } from "@/components/clerk-auth-provider";

type ClerkAvatarProps = Readonly<{
  className: string;
  decorative?: boolean;
  imageSize: number;
}>;

function clerkImageLoader({ src }: Readonly<{ src: string }>): string {
  return src;
}

export function ClerkAvatar({ className, decorative = false, imageSize }: ClerkAvatarProps) {
  const { status, user } = useCustomerAuth();
  const name = user?.fullName || user?.firstName || "Khách hàng Hưng Phát";
  const imageUrl = user?.imageUrl?.trim();
  const initial = name.trim().charAt(0).toLocaleUpperCase("vi") || "H";

  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : `Ảnh đại diện ${name}`}
      className={`${className}${imageUrl ? " has-clerk-image" : ""}`}
      role={decorative ? undefined : "img"}
    >
      {imageUrl ? (
        <Image
          alt=""
          height={imageSize}
          loader={clerkImageLoader}
          src={imageUrl}
          unoptimized
          width={imageSize}
        />
      ) : status === "signed-in" ? (
        <span className="clerk-avatar-initial">{initial}</span>
      ) : (
        <UserRound aria-hidden="true" size={Math.round(imageSize * .48)} strokeWidth={1.8} />
      )}
    </span>
  );
}
