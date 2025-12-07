import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

const HeroHeaderShape = () => (
  <svg
    className="absolute right-0 top-0 text-gray-100"
    width="686"
    height="630"
    viewBox="0 0 686 630"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse
      cx="403.5"
      cy="231.894"
      rx="403.5"
      ry="397.98"
      fill="currentColor"
    />
  </svg>
);

const HeroHeader11 = () => {
  return (
    <section className="ezy__header11 light py-24 md:py-44 bg-white  text-indigo-900  relative z-10 overflow-hidden">
      <HeroHeaderShape />

      <div className="container px-4 mx-auto relative">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6 xl:col-span-5 xl:pr-12 text-center lg:text-start">
            <div className="flex flex-col justify-center h-full">
              <h2 className="text-3xl font-bold md:text-[70px] leading-none mb-6">
                Bimbingan Konseling
              </h2>
              <p className="text-[22px] leading-normal opacity-80">
                Dapatkan pendampingan dan solusi untuk masalah pribadi,
                akademik, dan karir Anda bersama konselor berpengalaman kami.
              </p>
              <div>
                <a
                  href="/student/booking/create"
                  className="bg-white  text-indigo-900  shadow-xl rounded py-3 px-8 text-xl mt-6 md:mt-12 inline-block"
                >
                  Konsultasi Sekarang{" "}
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </a>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6 xl:col-span-5 text-center lg:text-start">
            <img
              src="https://www.bicarakan.id/_astro/hero.knmGl84B.png"
              alt="Konselor profesional memberikan bimbingan"
              className="rounded max-w-full h-full mt-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroHeader11;
