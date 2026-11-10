# Etapa 1: Runtime base para executar a aplicação em produção
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Etapa 2: SDK para compilar o código C#
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências Nuget
COPY ["api.csproj", "./"]
RUN dotnet restore "api.csproj"

# Copia todo o restante do código fonte e realiza o build
COPY . .
RUN dotnet build "api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Etapa 3: Publicação dos artefatos otimizados
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Etapa 4: Imagem final leve para execução
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "api.dll"]