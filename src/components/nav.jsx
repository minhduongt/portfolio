import { ReactNode, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";

const Links = [
  {
    id: "#about",
    name: "About",
  },

  {
    id: "#projects",
    name: "Projects",
  },
  {
    id: "#work-history",
    name: "Work History",
  },
];
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (
        direction !== scrollDirection &&
        (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)
      ) {
        setScrollDirection(direction);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };
    window.addEventListener("scroll", updateScrollDirection); // add event listener
    return () => {
      window.removeEventListener("scroll", updateScrollDirection); // clean up
    };
  }, [scrollDirection]);

  return scrollDirection;
}

export default function NavigationBar() {
  const [isTop, setTop] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const scrollDirection = useScrollDirection();
  const onClickScroll = (id) => {
    console.log(id);
    const section = document.querySelector(id);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const onScroll = () => {
    setTop(document.documentElement.scrollTop < 30);
  };
  useEffect(() => {
    document.addEventListener("scroll", onScroll);
    // Remove listener on unmount
    return () => document.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <Flex
        // borderTop={isTop ? "solid 2px #ffbb00" : ""}
        px={4}
        h={"5rem"}
        w="100%"
        position={"fixed"}
        top={isTop ? "0" : scrollDirection === "down" ? "-5rem" : "0"}
        backgroundColor={isTop ? "#00000020" : "#00000095"}
        transition="all 0.5s"
        zIndex={"99"}
      >
        <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
          <IconButton
            size={"md"}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={"Open Menu"}
            display={{ md: "none" }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={"center"}>
            {/* <Box>Logo</Box> */}
            <HStack
              as={"nav"}
              spacing={4}
              display={{ base: "none", md: "flex" }}
            >
              {Links.map((link) => (
                <Text
                  fontSize={"large"}
                  px={2}
                  py={1}
                  rounded={"md"}
                  color="white"
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "none",
                    bg: useColorModeValue("gray.200", "gray.700"),
                  }}
                  onClick={() => onClickScroll(link.id)}
                  key={link.id}
                >
                  {link.name}
                </Text>
              ))}
            </HStack>
          </HStack>
          {/* <Flex alignItems={'center'}>
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}>
                <Avatar
                  size={'sm'}
                  src={
                    'https://web.archive.org/web/20230521174858/https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
                  }
                />
              </MenuButton>
              <MenuList>
                <MenuItem>Link 1</MenuItem>
                <MenuItem>Link 2</MenuItem>
                <MenuDivider />
                <MenuItem>Link 3</MenuItem>
              </MenuList>
            </Menu>
          </Flex> */}
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: "none" }}>
            <Stack as={"nav"} spacing={4}>
              {Links.map((link) => (
                <Text
                  fontSize={"large"}
                  px={2}
                  py={1}
                  rounded={"md"}
                  color="white"
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "none",
                    bg: useColorModeValue("gray.200", "gray.700"),
                  }}
                  onClick={() => onScroll(link.id)}
                  key={link.id}
                >
                  {link.name}
                </Text>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Flex>
    </>
  );
}
