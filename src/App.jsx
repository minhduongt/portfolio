import { useEffect, useState } from "react";

import "./App.css";
import { Box, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import NavigationBar from "./components/nav";
import ScrollToTop from "./components/scrollToTop";
import InfiniteScroll from "./components/infiniteScroll";
import StepperHistory from "./components/stepper";
import Card from "./components/card";
import quoteList from "./data/quotes";
const projects = [
  { name: "Fine", description: "Order food together" },
  { name: "Herald Travel", description: "Popular travel places" },
  {
    name: "Social Management",
    description: "Manage posts on many social sites",
  },
];
const programLangs = ["JavaScript + TypeScript", "C#", "Dart"];
const feTechs = [
  "React JS",
  "Next JS",
  "HTML + CSS",
  "Flutter",
  "React Native",
];
const beTechs = ["ASP.NET", "Node JS", "Rest APIs", "SQL Server"];
const otherTechs = ["UX/UI", "Figma", "Firebase", "Git", "Agile", "Scrum"];

function App() {
  const [limit, setLimit] = useState(5);
  const [totalRows, setTotalRows] = useState(0);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    (async () => {
      // const response = await (
      //   await fetch(`https://zenquotes.io/api/quotes`)
      // ).json();
      const newList = quoteList.slice(0, limit);
      setQuotes([...newList]);
      setTotalRows(quoteList.length);
    })();
  }, [limit]);

  return (
    <Stack width={"100vw"}>
      <NavigationBar />
      <Stack className="main" px="5rem" pt="10rem">
        <header>
          <h1>Duong Tan Minh</h1>
          <h4>Web Developer</h4>
          <p>😄 Welcome to my website!</p>
        </header>

        <blockquote id="about">
          <p>
            I like making website and application catchy, cheesy and easy to
            experience and also work properly
          </p>
        </blockquote>

        <section>
          <h2>📜 About</h2>
          <p>
            I am an endurable and flexible developer. My career objective is
            improving and completing my skills and study more and more such as
            DevOps and Testing to expand working and knowledge range. I'm
            willing to study and update brand new information and technologies
            so as to build interactive, convenient, modern websites and
            applications those would make life better.
          </p>

          {/* <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p> */}
        </section>
        <section id="techs">
          <h2>🚀 Main Technologies</h2>
          <Stack>
            <Text fontSize={"large"}>Programming Languages</Text>
            <Stack flexDirection={"row"} gap={5}>
              {programLangs.map((tech) => (
                <li key={tech} fontSize={"medium"}>
                  {tech}
                </li>
              ))}
            </Stack>
            <Text fontSize={"large"}>Frontend</Text>
            <Stack flexDirection={"row"} gap={5}>
              {feTechs.map((tech) => (
                <li key={tech} fontSize={"medium"}>
                  {tech}
                </li>
              ))}
            </Stack>
            <Text fontSize={"large"}>Backend</Text>
            <Stack flexDirection={"row"} gap={5}>
              {beTechs.map((tech) => (
                <li key={tech} fontSize={"medium"}>
                  {tech}
                </li>
              ))}
            </Stack>
            <Text fontSize={"large"}>Others</Text>
            <Stack flexDirection={"row"} gap={5}>
              {otherTechs.map((tech) => (
                <li key={tech} fontSize={"medium"}>
                  {tech}
                </li>
              ))}
            </Stack>
          </Stack>
        </section>
        <section className="light" id="projects">
          <h2>👩🏽‍🚀 Projects</h2>
          <Flex px={"2rem"} justifyContent={"space-between"}>
            {projects.map((project) => (
              <Card name={project.name} description={project.description} />
            ))}
          </Flex>
          <Flex justifyContent={"center"}>
            <a href="https://github.com/minhduongt?tab=repositories">
              See more on my github !!
            </a>
          </Flex>
        </section>

        <blockquote>
          <p>
            “If everything was perfect you would never learn and you would never
            grow.”<br></br> - Beyonce
          </p>
        </blockquote>

        <section className="left" id="work-history">
          <h2>🌮 Work History</h2>

          {/* <h3>Reso</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <h3>BeanOi</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
            pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.
          </p> */}
          <StepperHistory />
        </section>

        <section className="light">
          <h2 id="accomlisments">🏆 Accomplishments</h2>

          <p>
            <a href="https://thanhnien.vn/quan-quan-sinh-vien-am-giai-200-trieu-cua-tiki-hacking-trail-2022-1851480558.htm">
              {" "}
              Third Prize at FPT Entrepreneurial Hackathon 10/2022 (Co-Order)
            </a>{" "}
            <br />
            <a href="https://campusmap.info/">
              The Most Promising Prize at FPT Entrepreneurial Hackathon 02/2023
              (Campus Map)
            </a>
          </p>
        </section>
        {/* <blockquote>
          <p>Thanks for surfing!</p>
        </blockquote> */}

        <Text fontSize={"6rem"} pb="2rem" color={"#ffd17b"}>
          Let see some motivating quotes today !
        </Text>
        <InfiniteScroll
          loader={
            <Flex justifyContent={"center"} alignItems={"center"} gap={5}>
              <Spinner size="md" />
              <Text fontSize={"large"}>Getting more quotes for you...</Text>
            </Flex>
          }
          fetchMore={() => setLimit((prev) => prev + 5)}
          hasMore={quotes.length < totalRows}
          endMessage={
            <Text fontSize={"4rem"} color={"#ffd17b"} textAlign={"center"}>
              You have seen it all! Thanks for surfing, Hope you have a great
              day!
            </Text>
          }
        >
          {quotes.map((quote, index) => (
            <Stack key={index} py="3rem">
              <Text
                fontSize={"4rem"}
                backgroundColor={"#8d8d8da6"}
              >{`"${quote.q}"`}</Text>
              <Text fontSize={"5rem"}>{`-${quote.a}`}</Text>
              {/* <Text
                  fontSize={"6rem"}
                  dangerouslySetInnerHTML={{ __html: quote.h }}
                /> */}
              {/* <h1 className="font-bold text-xl"></h1> */}

              {/* <p>{post.description}</p> */}
            </Stack>
          ))}
        </InfiniteScroll>
        <ScrollToTop />
      </Stack>
    </Stack>
  );
}

export default App;
