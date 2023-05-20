import { useEffect, useState } from "react";
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
  useToast,
  Select,
  Text,
  Checkbox,
  Box,
  Stack,
} from "@chakra-ui/react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { yupResolver } from "@hookform/resolvers/yup";

import { Input } from "components/FormFields";
import { useLoading } from "hooks/useLoading";
import { getPriorities } from "services/priorities";
import { getFlows } from "services/flows";
import { updateProcess } from "services/processes";

type FormValues = {
  record: string;
  nickname: string;
  idFlow: number;
  idPriority: number;
};

const validationSchema = yup.object({
  record: yup.string().required("Digite o número do Registro."),
  nickname: yup.string().required("Dê um apelido para esse Registro."),
  idFlow: yup.string().required("Selecione um fluxo para esse Registro"),
  idPriority: yup.string().notRequired(),
});

interface EditionModalProps {
  selectedProcess: Process;
  isOpen: boolean;
  onClose: () => void;
  afterSubmission: () => void;
}

export function EditionModal({
  selectedProcess,
  isOpen,
  onClose,
  afterSubmission,
}: EditionModalProps) {
  const toast = useToast();
  const { handleLoading } = useLoading();
  const [legalPriority, setLegalPriority] = useState(false);
  const { data: prioritiesData } = useQuery({
    queryKey: ["priorities"],
    queryFn: getPriorities,
    onError: () => {
      toast({
        id: "priorities-error",
        title: "Erro ao carregar prioridades",
        description:
          "Houve um erro ao carregar prioriaddes, favor tentar novamente.",
        status: "error",
        isClosable: true,
      });
    },
  });
  const { data: flowsData } = useQuery({
    queryKey: ["flows"],
    queryFn: getFlows,
    onError: () => {
      toast({
        id: "flows-error",
        title: "Erro ao carregar fluxos",
        description:
          "Houve um erro ao carregar fluxos, favor tentar novamente.",
        status: "error",
        isClosable: true,
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    reValidateMode: "onChange",
  });

  const onSubmit = handleSubmit(async (formData) => {
    handleLoading(true);
    const body = {
      record: selectedProcess?.record,
      nickname: formData.nickname,
      idFlow: formData.idFlow,
      priority: legalPriority ? formData.idPriority : 0,
      effectiveDate: new Date(),
    };

    const res = await updateProcess(body);

    onClose();
    afterSubmission();

    if (res.type === "success") {
      handleLoading(false);

      toast({
        id: "edit-process-success",
        title: "Sucesso!",
        description: "Processo editado com sucesso!",
        status: "success",
      });
      return;
    }

    handleLoading(false);
    toast({
      id: "edit-process-error",
      title: "Erro ao editar processo",
      description: res.error?.message,
      status: "error",
      isClosable: true,
    });
  });

  const handlePriority = async () => {
    setLegalPriority(selectedProcess?.idPriority !== 0);
  };

  useEffect(() => {
    handlePriority();
  }, [selectedProcess]);

  useEffect(() => {
    reset();
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={["full", "xl"]}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Processo</ModalHeader>
        <ModalCloseButton />

        <chakra.form onSubmit={onSubmit}>
          <ModalBody>
            <Input
              type="text"
              label="Registro"
              placeholder="N do Registro "
              errors={errors.record}
              backgroundColor="gray.200"
              value={selectedProcess?.record}
              readOnly
              infoText={
                <Stack spacing="0">
                  <Text>
                    Não é possível editar o número do registro do processo.
                  </Text>
                </Stack>
              }
              marginBottom={2}
              {...register("record")}
            />
            <Input
              type="text"
              label="Apelido"
              placeholder="Escolha um apelido para o registro"
              defaultValue={selectedProcess?.nickname}
              errors={errors.nickname}
              marginBottom={2}
              {...register("nickname")}
            />
            <Text fontWeight={500}>Fluxo</Text>
            <Select
              placeholder="Selecionar Fluxo"
              marginBottom={2}
              color="gray.500"
              {...register("idFlow")}
              defaultValue={
                typeof selectedProcess?.idFlow === "number"
                  ? selectedProcess?.idFlow
                  : selectedProcess?.idFlow[0]
              }
            >
              {flowsData?.value &&
                flowsData.value.map((flow) => {
                  return <option value={flow.idFlow}>{flow.name}</option>;
                })}
            </Select>
            <Checkbox
              colorScheme="green"
              borderColor="gray.600"
              isChecked={legalPriority}
              onChange={() => setLegalPriority(!legalPriority)}
              marginBottom={2}
            >
              Com prioridade legal
            </Checkbox>
            {legalPriority && (
              <Box>
                <Text fontWeight={500}>Prioridade Legal</Text>
                <Select
                  placeholder="Selecionar Prioriadade"
                  marginBottom={2}
                  color="gray.500"
                  {...register("idPriority")}
                  defaultValue={selectedProcess?.idPriority}
                >
                  {prioritiesData?.value &&
                    prioritiesData.value.map((priority) => {
                      return (
                        <option value={priority.idPriority}>
                          {priority.description}
                        </option>
                      );
                    })}
                </Select>
              </Box>
            )}
          </ModalBody>
          <ModalFooter gap="2">
            <Button variant="ghost" onClick={onClose} size="sm">
              Cancelar
            </Button>
            <Button colorScheme="blue" type="submit" size="sm">
              Salvar
            </Button>
          </ModalFooter>
        </chakra.form>
      </ModalContent>
    </Modal>
  );
}
