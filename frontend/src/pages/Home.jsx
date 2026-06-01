import React from "react";
import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import Certification from "../components/Certification";
import HomeDoctor from "../components/HomeDoctor";
import Testimonial from "../components/Testimonial";
import Footer from "../components/Footer";
import DoctorPage from "../components/DoctorPage";
const Home = () => {
  return (
    <div>
     <Navbar />
     <Banner />
     <Certification />
     <HomeDoctor />
     <Testimonial />
     <Footer />
     <DoctorPage />
  </div>
  );
};

export default Home;
