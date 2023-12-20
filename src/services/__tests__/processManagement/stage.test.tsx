import MockAdapter from "axios-mock-adapter";
import {
  createStage,
  updateStage,
  deleteStage,
} from "services/processManagement/stage";
import { api } from "../../api";

const apiMock = new MockAdapter(api.processManagement);

describe("Testes para a função createStage", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const stageCreationData = {
    name: "Novo Estágio",
    duration: 5,
  };

  it("deve criar um novo estágio com sucesso", async () => {
    const responseData = { message: "Ok" };
    apiMock
      .onPost("/stage/newStage", stageCreationData)
      .reply(200, responseData);

    const result = await createStage(stageCreationData);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao criar um novo estágio", async () => {
    apiMock.onPost("/stage/newStage", stageCreationData).reply(500);

    const result = await createStage(stageCreationData);

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
    idStage: 123,
    name: "Estágio Atualizado",
    duration: 7,
  };

  it("deve atualizar um estágio com sucesso", async () => {
    const responseData = { message: "Ok" };
    apiMock
      .onPut(`/stage/updateStage/${stageUpdateData.idStage}`, stageUpdateData)
      .reply(200, responseData);

    const result = await updateStage(stageUpdateData);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao atualizar um estágio", async () => {
    apiMock
      .onPut(`/stage/updateStage/${stageUpdateData.idStage}`, stageUpdateData)
      .reply(500);

    const result = await updateStage(stageUpdateData);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função deleteStage", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const stageIdToDelete = 123;

  it("deve excluir um estágio com sucesso", async () => {
    const responseData = { message: "Ok" };
    apiMock
      .onDelete(`/stage/deleteStage/${stageIdToDelete}`)
      .reply(200, responseData);

    const result = await deleteStage(stageIdToDelete);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao excluir um estágio", async () => {
    apiMock.onDelete(`/stage/deleteStage/${stageIdToDelete}`).reply(500);

    const result = await deleteStage(stageIdToDelete);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});
