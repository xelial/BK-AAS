import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faBehance,
  faDribbble,
} from "@fortawesome/free-brands-svg-icons";

const socialLinks = [
  {
    icon: faFacebook,
    href: "",
  },
  {
    icon: faTwitter,
    href: "",
  },
  {
    icon: faDribbble,
    href: "",
  },
  {
    icon: faBehance,
    href: "",
  },
];

const SocialLinks = () => (
  <ul className="flex flex-wrap justify-center lg:justify-end -mx-2">
    {socialLinks.map((link, i) => (
      <li key={i} className="mx-2 my-1.5">
        <a
          href={link.href}
          className="text-current hover:text-blue-600 transition-colors duration-300"
        >
          <FontAwesomeIcon icon={link.icon} className="w-4 h-4" />
        </a>
      </li>
    ))}
  </ul>
);

const Copyright3 = () => {
  return (
    <section className="bg-gray-100 text-gray-800 text-center lg:text-left py-5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="lg:w-1/3 mb-4 lg:mb-0">
            <p className="text-sm">Copyright all rights reserved</p>
          </div>
          <div className="lg:w-1/3">
            <SocialLinks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Copyright3;
