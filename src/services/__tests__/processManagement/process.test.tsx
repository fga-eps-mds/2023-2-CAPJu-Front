import MockAdapter from "axios-mock-adapter";
import {
  deleteProcess,
  createProcess,
  updateProcess,
  getProcessByRecord,
  getProcessById,
  updateStage,
  updateProcessStatus,
  finalizeProcess,
  archiveProcess,
} from "services/processManagement/processes";
import { api } from "../../api";

const apiMock = new MockAdapter(api.processManagement);

describe("Testes para a função deleteProcess", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const idProcess = 987;

  it("deve deletar um processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock
      .onDelete(`/process/deleteProcess/${idProcess}`)
      .reply(200, responseData);

    const result = await deleteProcess(idProcess);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao deletar um processo", async () => {
    apiMock.onDelete(`/process/deleteProcess/${idProcess}`).reply(500);

    const result = await deleteProcess(idProcess);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função createProcess", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const processData = {
    record: "ABC123",
    nickname: "Processo A",
    idFlow: 789,
    priority: 1,
  };

  it("deve criar um novo processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock.onPost("/process/newProcess", processData).reply(200, responseData);

    const result = await createProcess(processData);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao criar um novo processo", async () => {
    apiMock.onPost("/process/newProcess", processData).reply(500);

    const result = await createProcess(processData);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função updateProcess", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const processUpdateData = {
    idProcess: 123,
    nickname: "Novo Nome",
    idFlow: 456,
    priority: 2,
    effectiveDate: "2023-01-01",
    status: "Em Andamento",
    idStage: 789,
  };

  it("deve atualizar um processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock
      .onPut(
        `/process/updateProcess/${processUpdateData.idProcess}`,
        processUpdateData
      )
      .reply(200, responseData);

    const result = await updateProcess(processUpdateData);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao atualizar um processo", async () => {
    apiMock
      .onPut(
        `/process/updateProcess/${processUpdateData.idProcess}`,
        processUpdateData
      )
      .reply(500);

    const result = await updateProcess(processUpdateData);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função getProcessByRecord", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const record = "ABC123";

  it("deve obter um processo pelo número de registro com sucesso", async () => {
    const responseData = { message: "Ok" };
    apiMock.onGet(`/process/record/${record}`).reply(200, responseData);

    const result = await getProcessByRecord(record);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao obter um processo pelo número de registro", async () => {
    apiMock.onGet(`/process/record/${record}`).reply(500);

    const result = await getProcessByRecord(record);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função getProcessById", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const idProcess = 123;

  it("deve obter um processo pelo ID com sucesso", async () => {
    const responseData = { message: "Ok" };
    apiMock.onGet(`/process/${idProcess}`).reply(200, responseData);

    const result = await getProcessById(idProcess);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao obter um processo pelo ID", async () => {
    apiMock.onGet(`/process/${idProcess}`).reply(500);

    const result = await getProcessById(idProcess);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função updateStage", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const stageUpdateData = {
    idProcess: 123,
    record: "ABC123",
    from: 1,
    to: 2,
    commentary: "Comentário de estágio",
    idFlow: 456,
    isNextStage: true,
  };

  it("deve atualizar o estágio de um processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock
      .onPut("/process/updateStage", stageUpdateData)
      .reply(200, responseData);

    const result = await updateStage(stageUpdateData);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao atualizar o estágio de um processo", async () => {
    apiMock.onPut("/process/updateStage", stageUpdateData).reply(500);

    const result = await updateStage(stageUpdateData);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função updateProcessStatus", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const processStatusUpdateData = {
    priority: 2,
    idFlow: 456,
    idProcess: 123,
    status: "Em Andamento",
  };

  it("deve atualizar o status de um processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock
      .onPut(
        `/process/updateProcess/${processStatusUpdateData.idProcess}`,
        processStatusUpdateData
      )
      .reply(200, responseData);

    const result = await updateProcessStatus(processStatusUpdateData);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao atualizar o status de um processo", async () => {
    apiMock
      .onPut(
        `/process/updateProcess/${processStatusUpdateData.idProcess}`,
        processStatusUpdateData
      )
      .reply(500);

    const result = await updateProcessStatus(processStatusUpdateData);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função finalizeProcess", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const mockProcess = {
    idProcess: 123,
    record: "abcd",
    nickname: "apelido",
    idFlow: 1,
    idPriority: 1,
    idStage: 1,
    idUnit: 1,
    effectiveDate: new Date().toString(),
    status: "status",
  };

  it("deve finalizar um processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock
      .onPut(`/process/finalizeProcess/${mockProcess.idProcess}`)
      .reply(200, responseData);

    const result = await finalizeProcess(mockProcess);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao finalizar um processo", async () => {
    apiMock
      .onPut(`/process/finalizeProcess/${mockProcess.idProcess}`)
      .reply(500);

    const result = await finalizeProcess(mockProcess);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função archiveProcess", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const mockProcess = {
    idProcess: 123,
    record: "abcd",
    nickname: "apelido",
    idFlow: 1,
    idPriority: 1,
    idStage: 1,
    idUnit: 1,
    effectiveDate: new Date().toString(),
    status: "Em Andamento",
  };

  it("deve arquivar um processo com sucesso", async () => {
    const responseData = { message: "ok" };
    apiMock
      .onPut(`/process/archiveProcess/${mockProcess.idProcess}/true`)
      .reply(200, responseData);

    const result = await archiveProcess(mockProcess);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao arquivar/desarquivar um processo", async () => {
    apiMock
      .onPut(`/process/archiveProcess/${mockProcess.idProcess}/true`)
      .reply(500);

    const result = await archiveProcess(mockProcess);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});
