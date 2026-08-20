interface FooterLinkSectionProps {
  title: string;
  links: { label: string; href: string }[];
}

export default function FooterLinkSection({ title, links }: FooterLinkSectionProps) {
  return (
    <div>
      <h4 className="font-manrope font-bold mb-6">{title}</h4>
      <ul className="flex flex-col gap-4 text-[#A1A3A9] font-inter text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="hover:text-teal transition-colors">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
