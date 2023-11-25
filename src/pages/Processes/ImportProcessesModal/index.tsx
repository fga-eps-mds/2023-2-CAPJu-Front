import React, { useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  chakra,
  Button,
  Spacer,
  Flex,
  useToast,
} from "@chakra-ui/react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Input } from "components/FormFields";
import { useLoading } from "hooks/useLoading";
import { Icon } from "@chakra-ui/icons";
import { FaFileDownload } from "react-icons/fa";
import InputFile from "../../../components/FormFields/InputFile/InputFile";
import { importFile } from "../../../services/processManagement/processesFile";

type FormValues = {
  name: string;
  file: File;
};

const validationSchema = yup.object({
  name: yup.string().required("Digite o nome da importação"),
  file: yup
    .mixed()
    .test(
      "fileType",
      "Formato inválido. Insira um .xlsx ou .xls.",
      (value: any) => {
        if (!value) return false;
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        return allowedTypes.includes(value.type);
      }
    )
    .required("Insira a planilha"),
});

interface ImportProcessesModalProps {
  isOpen: boolean;
  onClose: () => void;
  afterSubmission: () => void;
}

export function ImportProcessesModal({
  isOpen,
  onClose,
  afterSubmission,
}: ImportProcessesModalProps) {
  const toast = useToast();

  const { handleLoading } = useLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    // @ts-ignore
    resolver: yupResolver(validationSchema),
    reValidateMode: "onChange",
  });

  const onSubmit = handleSubmit(
    async (formData: { file: File; name: string }) => {
      handleLoading(true);

      const res = await importFile({
        file: formData.file,
        name: formData.name,
      });

      if (res.type === "success") {
        toast({
          id: "file-added-queue",
          title: "Sucesso!",
          description: "Arquivo adicionado à fila com sucesso",
          status: "success",
        });
      } else {
        toast({
          id: "file-added-queue-error",
          title: "Erro ao adicionar processo à fila",
          description: res.error?.message,
          status: "error",
          isClosable: true,
        });
      }

      onClose();
      afterSubmission();
      handleLoading(false);
    }
  );

  useEffect(() => {
    reset();
  }, [isOpen]);

  // @ts-ignore
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={["full", "xl"]}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Importar lote</ModalHeader>
        <ModalCloseButton />
        <chakra.form onSubmit={onSubmit}>
          <ModalBody display="flex" flexDir="column" gap="3">
            <Input
              type="text"
              label="Importação"
              placeholder="Nome da importação"
              {...register("name")}
              errors={errors.name}
            />
            <InputFile
              label="Arquivo"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                if (!event.target.files?.length) return;
                const selectedFile = event.target.files[0];
                setValue("file", selectedFile);
              }}
              externalError={errors.file}
            />
          </ModalBody>
          <ModalFooter>
            <a
              href="public/files/modeloImportacaoCapju.xlsx"
              download
              style={{ textDecoration: "none" }}
            >
              <Button variant="outline" colorScheme="black">
                <Icon
                  as={FaFileDownload}
                  boxSize={4}
                  style={{ marginRight: "8px" }}
                />{" "}
                Baixar modelo
              </Button>
            </a>
            <Spacer />
            <Flex gap="2">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue" type="submit">
                Importar
              </Button>
            </Flex>
          </ModalFooter>
        </chakra.form>
      </ModalContent>
    </Modal>
  );
}