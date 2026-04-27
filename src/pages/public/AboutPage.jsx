import React from "react";

export default function AboutPage() {
  return (
    <section className="container page-section about-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">About AIDEP</span>
          <h1 className="title-lg">
            AI-Driven E-Commerce Platform for Smarter Digital Commerce
          </h1>
          <p className="muted">
            AIDEP is a modern online marketplace built to improve how customers
            shop, how merchants sell, and how administrators manage a secure and
            scalable e-commerce platform.
          </p>
        </div>
      </div>

      <div className="soft-panel about-intro">
        <h2 className="title-md">What is AIDEP?</h2>
        <p>
          AIDEP, short for <strong>AI-Driven E-Commerce Platform</strong>, is a
          digital commerce system designed to combine reliable online shopping
          features with intelligent support tools. The platform brings together
          product browsing, cart management, checkout, order tracking, merchant
          product management, admin control, chatbot support, and personalized
          recommendations in one system.
        </p>
        <p>
          Its purpose is to solve common problems found in traditional
          e-commerce platforms, such as poor product discovery, limited customer
          support, generic shopping experiences, and inefficient order
          management. AIDEP is designed to make online shopping more personal,
          responsive, and easier to manage.
        </p>
      </div>
      <br></br>
      <div className="grid-auto">
        <article className="soft-panel about-tile">
          <h2 className="title-md">For Customers</h2>
          <p>
            Customers can browse products, search for items, save products to a
            wishlist, add items to a cart, complete checkout, and track their
            orders. AIDEP also provides personalized product suggestions to help
            customers discover items that match their interests.
          </p>
        </article>

        <article className="soft-panel about-tile">
          <h2 className="title-md">For Merchants</h2>
          <p>
            Merchants can upload products, manage product images, update prices
            and stock, review customer orders, approve purchases, and update
            order progress. The merchant workspace helps sellers organize their
            online business and serve customers more efficiently.
          </p>
        </article>

        <article className="soft-panel about-tile">
          <h2 className="title-md">For Administrators</h2>
          <p>
            Administrators manage the platform by monitoring users, controlling
            account status, and helping maintain a safe environment. Admin tools
            allow accounts to be reviewed, suspended, or disabled when needed.
          </p>
        </article>
      </div>

      <div className="soft-panel about-intro">
        <h2 className="title-md">Intelligent Shopping Support</h2>
        <p>
          AIDEP includes a chatbot assistant that helps users navigate the
          platform, search for products, and understand where to find order or
          account information. The platform also includes a recommendation system
          that uses user activity to provide more relevant product suggestions.
        </p>
        <p>
          These intelligent features are designed to improve the customer
          experience while giving merchants better opportunities to connect their
          products with interested buyers.
        </p>
      </div>

      <div className="grid-auto">
        <article className="soft-panel about-tile">
          <h2 className="title-md">Why AIDEP?</h2>
          <p>
            AIDEP is more than a basic online store. It is a complete commerce
            ecosystem that connects customers, merchants, and administrators
            through a secure, organized, and intelligent platform.
          </p>
        </article>

        <article className="soft-panel about-tile">
          <h2 className="title-md">Africa-Ready Vision</h2>
          <p>
            The platform is designed with scalability in mind and is suitable
            for broad African e-commerce needs. It is not limited to one country
            and can support different markets, sellers, products, and customer
            experiences as the platform grows.
          </p>
        </article>

        <article className="soft-panel about-tile">
          <h2 className="title-md">Our Mission</h2>
          <p>
            AIDEP’s mission is to create a smarter, more accessible, and more
            user-friendly digital marketplace where customers can shop
            confidently, merchants can grow their businesses, and intelligent
            technology can improve the future of e-commerce.
          </p>
        </article>
      </div>
    </section>
  );
}