export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      {...props}
    >
      <rect width="256" height="256" fill="none" />
      <path
        d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"
        fill="currentColor"
      />
      <path
        d="M168,88H112a8,8,0,0,0-8,8v48a8,8,0,0,0,8,8h24a8,8,0,0,0,0-16H120V104h48a8,8,0,0,0,0-16Z"
        fill="currentColor"
      />
      <path
        d="M168,168H104a8,8,0,0,0-8,8v16a8,8,0,0,0,16,0v-8h56a8,8,0,0,0,0-16Z"
        opacity="0.5"
        fill="currentColor"
       />
    </svg>
  );
  