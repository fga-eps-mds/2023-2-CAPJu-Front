/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-duplicates */
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Text,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useQuery } from "react-query";
import "jspdf-autotable";
import { UserOptions } from "jspdf-autotable";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { addLogos, constructTableHTMLData } from "utils/pdf";
import moment from "moment";
import { Select } from "../FormFields";
import {
  getFlows,
  getHistoricFlow,
  getExpectedFlow,
} from "../../services/processManagement/flows";
import ChartTempos from "./ChartTempos";
import ExportExcel from "../ExportExcel";

export interface Data {
  Etapa: string;
  "Tempo Médio": number;
  "Tempo Previsto": number;
}

interface jsPDFCustom extends jsPDF {
  autoTable: (options: UserOptions) => void;
}

export default function StatsTimeStage() {
  const toast = useToast();
  const [idFlow, setIdFlow] = useState<number>();
  const [nameFlow, setNameFlow] = useState<string>("");
  const [chartData, setChartData] = useState<Data[]>();
  const [blankText, setBlankText] = useState<string>("");

  useEffect(() => {}, [chartData]);

  const mesclaVetores = (
    labels: Array<string>,
    medio: Array<number>,
    previsto: Array<number>
  ) => {
    const resultado = labels.map((label, index) => {
      const obj: Data = {
        Etapa: label,
        "Tempo Médio": medio[index],
        "Tempo Previsto": previsto[index],
      };
      return obj;
    });

    return resultado;
  };

  const { data: flowsData } = useQuery({
    queryKey: ["flows"],
    queryFn: async () => {
      const res = await getFlows();

      if (res.type === "error") throw new Error(res.error.message);

      return res;
    },
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
    refetchOnWindowFocus: false,
  });

  const getDataChart = async () => {
    setChartData(undefined);
    try {
      if (idFlow) {
        const historic = (await getHistoricFlow(idFlow)).value;
        const expected = (await getExpectedFlow(idFlow)).value;

        if (historic && expected) {
          const expectedArray = expected.map((item) => item.duration);
          const labels = expected.map((item) => item.name);

          const resultado = mesclaVetores(labels, historic, expectedArray);
          setChartData(resultado);
        } else {
          setBlankText("Não há dados para serem exibidos");
        }
      }
    } catch (error) {
      console.log("erro");
    }
  };

  const downloadPDF = async () => {
    const elem = document.querySelector<HTMLElement>(
      "#chart-tempo-medio-etapa"
    );

    if (elem) {
      const container = document.createElement("div");

      const emissionDate = moment().format("DD/MM/YYYY HH:mm:ss");

      const pdf = new jsPDF() as jsPDFCustom;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Tempo de Conclusão por Etapa de um Fluxo", 105, 20, {
        align: "center",
      });
      pdf.setFont("helvetica", "normal");
      pdf.text(`Fluxo: ${nameFlow}`, 15, 30);
      pdf.text(`Data emissão: ${emissionDate}`, 15, 40);

      const currentY = 60;

      pdf.text(`Etapas do fluxo ${nameFlow}`, 15, 55);
      const tableHTML = constructTableHTMLData(chartData || []);
      container.style.display = "none";
      container.innerHTML = tableHTML;
      document.body.appendChild(container);

      pdf.autoTable({
        html: "#processData",
        useCss: true,
        startY: currentY,
      });

      let tableFinalY = (pdf as any).lastAutoTable.finalY;

      if (tableFinalY + 100 > 267) {
        pdf.addPage();
        tableFinalY = 20;
      }

      await html2canvas(elem).then(async (canvas) => {
        const dataURI = canvas.toDataURL("image/jpeg");

        pdf.setFont("helvetica", "bold");
        pdf.text(
          "Tempo de Conclusão por Etapa de um Fluxo",
          105,
          tableFinalY + 8,
          { align: "center" }
        );
        pdf.addImage(dataURI, "JPEG", 30, tableFinalY + 10, 150, 0);

        canvas.remove();
      });

      await addLogos(pdf, tableFinalY + 80);

      pdf.save(`Tempo_Medio_Etapas.pdf`);

      document.body.removeChild(container);
    }
  };

  return (
    <Flex w="100%" flexDir="column" mb="4">
      <Box backgroundColor="#ffffff" borderRadius="8px">
        <Accordion
          allowMultiple
          style={{
            width: "100%",
          }}
        >
          <AccordionItem border="hidden">
            <h2>
              <AccordionButton>
                <AccordionIcon />
                <Box
                  as="span"
                  flex="1"
                  textAlign="left"
                  marginLeft="18"
                  fontSize="17px"
                  fontWeight="600"
                  fontStyle="normal"
                  lineHeight="24px"
                >
                  Visualizar tempo médio de cada etapa
                </Box>
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Box display="flex" flexDirection="row">
                <Flex w="100%" justifyContent="space-between">
                  <Flex width="70%" gap="5">
                    <Select
                      id="flowSelect"
                      placeholder="Fluxo"
                      color="gray.500"
                      onChange={(e) => {
                        setIdFlow(parseInt(e.target.value, 10));
                        setNameFlow(
                          // @ts-ignore
                          e.target.children[e.target.selectedIndex].text
                        );
                      }}
                      options={
                        flowsData?.value
                          ? flowsData?.value?.map((flow) => {
                              return {
                                value: flow.idFlow,
                                label: flow.name,
                              };
                            })
                          : []
                      }
                    />
                    <Button
                      aria-label="Confirmar"
                      colorScheme="green"
                      justifyContent="center"
                      type="submit"
                      w="20%"
                      onClick={getDataChart}
                    >
                      Confirmar
                    </Button>
                  </Flex>
                  <Flex justifyContent="end" gap="3">
                    <Button
                      hidden={!chartData}
                      colorScheme="blue"
                      size="md"
                      marginLeft="8px"
                      marginRight="8px"
                      onClick={downloadPDF}
                    >
                      PDF
                    </Button>
                    <ExportExcel
                      fileName="Tempo_Medio_Etapas"
                      excelData={chartData || []}
                    />
                  </Flex>
                </Flex>
              </Box>
              <Flex justifyContent="center">
                <Box width="60%" justifyContent="space-around">
                  {chartData ? (
                    <ChartTempos value={chartData} nameFlow={nameFlow} />
                  ) : (
                    <Text textAlign="center" fontWeight="bolder" padding="10px">
                      {blankText}
                    </Text>
                  )}
                </Box>
              </Flex>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
    </Flex>
  );
}
