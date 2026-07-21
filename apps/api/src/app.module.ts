import { Controller, Get, Module } from "@nestjs/common";

@Controller("health")
class HealthController {
  @Get()
  check() { return { status: "ok", service: "twc-water-pos-api" }; }
}

@Module({ controllers: [HealthController] })
export class AppModule {}
