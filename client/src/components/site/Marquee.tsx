const WORDS = [
  "Ladies & Gents",
  "House pickup & drop",
  "RTA guidance",
  "Kondapur",
  "Hafeezpet",
  "Hyderabad",
];

/**
 * A slow, endless line of the school's confirmed services in slanted white capitals on a red band. Purely decorative (the same
 * facts appear in the page text), so it is hidden from assistive technology.
 */
export function Marquee() {
  const line = (
    <ul className="flex shrink-0 items-center">
      {WORDS.map((word) => (
        <li key={word} className="flex items-center">
          <span className="px-7 font-display text-2xl font-extrabold whitespace-nowrap text-white sm:px-10 sm:text-4xl">
            {word}
          </span>
          <span aria-hidden="true" className="text-brand-950">
            ◆
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div aria-hidden="true" className="overflow-hidden bg-accent-500 py-4 sm:py-5">
      <div className="animate-marquee flex w-max">
        {line}
        {line}
      </div>
    </div>
  );
}
