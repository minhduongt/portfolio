import { ReactNode } from "react";
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

export default function NavigationBar() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onScroll = (id) => {
    console.log(id);
    const section = document.querySelector(id);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Box
        bg={"#00000095"}
        px={4}
        sx={{
          position: "fixed",
          zIndex: 99,
          width: "100%",
          boxSizing: "border-box",
        }}
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
      </Box>

      <Box p={4}>Main Content Here</Box>
    </>
  );
}
