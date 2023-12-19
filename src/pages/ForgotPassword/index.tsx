import {
  Flex,
  Card,
  CardBody,
  Image,
  Text,
  Button,
  useToast,
  chakra,
  InputGroup,
  Stack,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLoading } from "hooks/useLoading";
import { Input } from "components/FormFields";
import {
  checkPasswordRecoveryToken,
  requestPasswordRecovery,
  updatePasswordFromRecoveryToken,
} from "services/user";
import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";
import { v4 as uuidv4 } from "uuid";

type FormValues = {
  email: string;
};

const validationSchema = yup.object({
  email: yup.string().required("Preencha seu Email").email("Email inválido"),
});

function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLoading, isLoading } = useLoading();
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(true);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [token, setToken] = useState("");

  async function checkUrlPasswordRecoveryToken() {
    const searchParams = new URLSearchParams(location.search);
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
      const res = await checkPasswordRecoveryToken(urlToken);
      if (res.type === "error") {
        toast({
          id: uuidv4(),
          description: (
            res.error?.message || "Erro ao verificar token."
          ).concat(" Você será redirecionado para a tela de login."),
          status: "error",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        setIsPasswordRecovery(true);
        setIsLoadingForm(false);
      }
    } else {
      setIsLoadingForm(false);
      setIsPasswordRecovery(false);
    }
  }

  useEffect(() => {
    checkUrlPasswordRecoveryToken().finally();
  }, [location]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    reValidateMode: "onChange",
  });

  const validationSchemaPassword = yup.object({
    password: yup
      .string()
      .required("Preencha a senha")
      .matches(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/,
        "Senha não cumpre critérios"
      ),
    passwordConfirmation: yup
      .string()
      .required("Confirme sua senha")
      .oneOf([yup.ref("password")], "Suas senhas não conferem."),
  });

  const {
    register: registerPasswordForm,
    handleSubmit: handleSubmitPasswordForm,
    formState: { errors: errorsPasswordForm },
  } = useForm({
    resolver: yupResolver(validationSchemaPassword),
    reValidateMode: "onChange",
  });

  const onPasswordSubmit = handleSubmitPasswordForm(async (data: any) => {
    handleLoading(true);
    const res = await updatePasswordFromRecoveryToken(token, data.password);
    if (res.type === "success") {
      navigate("/", { replace: true });
      toast({
        id: uuidv4(),
        description: "Senha atualizada com sucesso",
        status: "success",
      });
    } else {
      toast({
        id: uuidv4(),
        description: res.error?.message || "Erro ao atualizar senha",
        status: "error",
      });
    }
    handleLoading(false);
  });

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const togglePasswordVisibilityValidation = () =>
    setShowPasswordValidation(!showPasswordValidation);

  const onSubmit = handleSubmit(async (data) => {
    handleLoading(true);
    const res = await requestPasswordRecovery(data.email);
    if (res.type === "success") {
      handleLoading(false);
      navigate("/", { replace: true });
      toast({
        id: uuidv4(),
        title: "Email enviado com sucesso!",
        description: "Acesse seu e-mail para recuperar a senha",
        status: "success",
      });
      return;
    }
    handleLoading(false);
    toast({
      id: uuidv4(),
      description: res.error?.message || "Erro ao enviar solicitação",
      status: "error",
      isClosable: true,
    });
  });

  return (
    <>
      <style>
        {`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}
      </style>
      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        w="100%"
        py={["16", 0]}
      >
        <Card p={["10", "20"]} w="90%" maxW="454">
          {/* eslint-disable-next-line no-nested-ternary */}
          {isLoadingForm ? (
            <Flex justify="center" align="center" h="12vh">
              <ImSpinner8
                speed="0.65s"
                color="green.500"
                size="xl"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </Flex>
          ) : isPasswordRecovery ? (
            <CardBody
              w="100%"
              p={0}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap="3"
            >
              <Image w="100%" maxW="36" src="/assets/logo.png" m="0 auto" />
              <Text fontSize={["lg", "xl"]} fontWeight="semibold">
                Recuperação de senha
              </Text>
              <chakra.form
                w="100%"
                display="flex"
                flexDir="column"
                alignItems="center"
                justifyContent="start"
                gap="3"
                onSubmit={onPasswordSubmit}
              >
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="Nova senha"
                    placeholder="Digite a nova senha"
                    errors={errorsPasswordForm.password}
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readOnly")}
                    infoText={
                      <Stack spacing="0">
                        <Text>Deve conter ao menos um dígito;</Text>
                        <Text>
                          Deve conter ao menos uma letra maiúscula e uma letra
                          minuscula;
                        </Text>
                        <Text>Deve conter ao menos 6 caracteres;</Text>
                      </Stack>
                    }
                    {...registerPasswordForm("password")}
                  />
                  <InputRightElement>
                    <IconButton
                      onClick={togglePasswordVisibility}
                      aria-label={
                        showPassword ? "Esconder senha" : "Mostrar senha"
                      }
                      colorScheme="blue"
                      variant="ghost"
                      top="8"
                      icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                    />
                  </InputRightElement>
                </InputGroup>
                <InputGroup>
                  <Input
                    type={showPasswordValidation ? "text" : "password"}
                    label="Confirmação de senha"
                    placeholder="Confirme a senha"
                    errors={errorsPasswordForm.passwordConfirmation}
                    {...registerPasswordForm("passwordConfirmation")}
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readOnly")}
                  />
                  <InputRightElement>
                    <IconButton
                      onClick={togglePasswordVisibilityValidation}
                      aria-label={
                        showPasswordValidation
                          ? "Esconder senha"
                          : "Mostrar senha"
                      }
                      colorScheme="blue"
                      variant="ghost"
                      top="8"
                      icon={showPasswordValidation ? <FaEyeSlash /> : <FaEye />}
                    />
                  </InputRightElement>
                </InputGroup>
                <Button
                  colorScheme="green"
                  w="100%"
                  type="submit"
                  title={isLoading ? "Aguarde o fim da operação" : ""}
                  isDisabled={isLoading}
                >
                  Enviar
                </Button>
                <Button
                  w="100%"
                  onClick={() => navigate("/", { replace: true })}
                >
                  Cancelar
                </Button>
              </chakra.form>
            </CardBody>
          ) : (
            <CardBody
              w="100%"
              p={0}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap="3"
            >
              <Image w="100%" maxW="36" src="/assets/logo.png" m="0 auto" />
              <Text fontSize={["lg", "xl"]} fontWeight="semibold">
                Recuperação de senha
              </Text>
              <chakra.form
                w="100%"
                display="flex"
                flexDir="column"
                alignItems="center"
                justifyContent="start"
                gap="3"
                onSubmit={onSubmit}
              >
                <Input
                  type="email"
                  label="Email"
                  placeholder="exemplo@email.com"
                  errors={errors.email}
                  {...register("email")}
                  infoText="Um link para recuperação será enviado."
                />
                <Button
                  colorScheme="green"
                  w="100%"
                  type="submit"
                  title={isLoading ? "Aguarde o fim da operação" : ""}
                  isDisabled={isLoading}
                >
                  Enviar
                </Button>
                <Button
                  w="100%"
                  onClick={() => navigate("/", { replace: true })}
                >
                  Cancelar
                </Button>
              </chakra.form>
            </CardBody>
          )}
        </Card>
      </Flex>
    </>
  );
}

export default ForgotPassword;
