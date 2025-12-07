import React from "react";
import PropTypes from "prop-types";

const counselorList = [
  {
    author: {
      fullName: "Ricky Sudrajat",
      picture: "https://cdn.easyfrontend.com/pictures/users/user28.jpg",
      designation: "Phychologist",
    },
    description:
      "Land. Stars land every there was together very fifth, above greater also replenish seas good was second divide which beast abundantly blessed don't fifth us given make called gathering fowl. The gathered, hath. Which appear said there saw fish so Above. Light made is sea yielding let he that whose.",
  },
  {
    author: {
      fullName: "Henny",
      picture: "https://cdn.easyfrontend.com/pictures/users/user7.jpg",
      designation: "Business Head",
    },
    description:
      "Heaven day created don't kind darkness that which midst us created every. Shall good brought grass that bearing said fowl sixth them abundantly. Dominion. Every gathering so said forth doesn't all from. It tree. Have subdue third let void let gathering creepeth. Be saw appear. Day every it fruitful life.",
  },
  {
    author: {
      fullName: "Supri",
      picture: "https://cdn.easyfrontend.com/pictures/users/user26.jpg",
      designation: "UI Design",
    },
    description:
      "It's easier to reach your savings goals when you have the right savings account. Take a look and find the right one for you.It's easier to reach your savings goals when you have the right savings account. Take a look and find the right one for youIt's easier to reach your savings goals when you have the right savings account. Take a look and find the right one for you!",
  },
];

const CounselorItem = ({ counselor, index }) => (
  <div className="grid grid-cols-12 gap-6 mt-12">
    <div
      className={`col-span-12 md:col-span-5 ${index % 2 !== 0 && "md:order-2"}`}
    >
      <img
        src={counselor.author.picture}
        alt={counselor.author.fullName}
        className="w-full rounded"
      />
    </div>
    <div
      className={`col-span-12 md:col-span-6 ${
        index % 2 === 0 && "md:col-start-7"
      }`}
    >
      <div className="flex flex-col justify-center h-full">
        <h4 className="text-2xl font-medium mb-1">
          {counselor.author.fullName}
        </h4>
        <p className="mb-1">{counselor.author.designation}</p>
        <p className="opacity-50 lg:pr-20 mt-4">{counselor.description}</p>
      </div>
    </div>
  </div>
);

CounselorItem.propTypes = {
  counselor: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
};

const CounselorList = () => {
  return (
    <section className="ezy__counselorList light py-14 md:py-24 bg-gray-50  text-zinc-900 ">
      <div className="container px-4 mx-auto">
        <div className="flex justify-center mb-6 md:mb-12">
          <div className="sm:max-w-lg text-center">
            <h2 className="text-3xl leading-none md:text-[45px] font-bold mb-4">
              Our Counselors
            </h2>
            <p>
              Meet our experienced and qualified counselors ready to help you
              with your mental health journey.
            </p>
          </div>
        </div>

        {counselorList.map((counselor, i) => (
          <CounselorItem counselor={counselor} index={i} key={i} />
        ))}
      </div>
    </section>
  );
};

export default CounselorList;
