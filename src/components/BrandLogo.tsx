interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = 'w-8 h-8' }: BrandLogoProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Stylized FP geometric monogram matching FairPay brand */}
      <path
        d="M5 10.5C5 7.46243 7.46243 5 10.5 5H24.5C25.3284 5 26 5.67157 26 6.5V8.5C26 9.32843 25.3284 10 24.5 10H11.5C10.6716 10 10 10.6716 10 11.5V15H23.5C27.0899 15 30 17.9101 30 21.5C30 25.0899 27.0899 28 23.5 28H17.5V30.5C17.5 31.3284 16.8284 32 16 32H13.5C12.6716 32 12 31.3284 12 30.5V23.5C12 22.6716 12.6716 22 13.5 22H23C24.1046 22 25 21.1046 25 20C25 18.8954 24.1046 18 23 18H10V28.5C10 29.3284 9.32843 30 8.5 30H6.5C5.67157 30 5 29.3284 5 28.5V10.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
