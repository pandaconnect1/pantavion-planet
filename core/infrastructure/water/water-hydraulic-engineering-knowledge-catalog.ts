export type WaterKnowledgeAccess = "OPEN_INGEST" | "REFERENCE_ONLY_UNLESS_LICENSED";
export type WaterKnowledgeSource = {
  id:string;
  authority:string;
  title:string;
  era:"FOUNDATIONAL"|"MODERN"|"CURRENT";
  access:WaterKnowledgeAccess;
  url:string;
  topics:string[];
  notes:string;
};

export const PANTAVION_WATER_HYDRAULIC_KNOWLEDGE_SCOPE = [
  "continuity_and_energy_equations",
  "bernoulli_head_and_hydraulic_grade_line",
  "darcy_weisbach",
  "hazen_williams_legacy_practice_and_limitations",
  "colebrook_white_and_pipe_roughness",
  "minor_losses_and_fittings",
  "hardy_cross_and_loop_balancing_history",
  "pressure_pipe_network_modelling",
  "pressure_dependent_demand",
  "extended_period_simulation",
  "pumps_pump_curves_efficiency_and_controls",
  "reservoirs_and_storage_tanks",
  "gate_butterfly_check_prv_psv_fcv_valves",
  "district_metered_areas",
  "non_revenue_water_and_leakage",
  "pressure_management",
  "fire_and_peak_demand_scenarios",
  "network_calibration_with_flow_and_pressure_measurements",
  "scada_and_telemetry_inputs",
  "water_age_source_trace_and_disinfectant_decay",
  "backflow_cross_connection_and_contamination_risk",
  "pipe_breaks_isolation_and_valve_tracing",
  "transients_water_hammer_and_surge",
  "asset_condition_failure_history_and_criticality",
  "energy_optimisation",
  "emergency_and_resilience_scenarios",
] as const;

export const PANTAVION_WATER_KNOWLEDGE_SOURCES:WaterKnowledgeSource[]=[
  {
    id:"us-epa-epanet-2-2",
    authority:"United States Environmental Protection Agency",
    title:"EPANET 2.2 User Manual and official EPANET resources",
    era:"CURRENT",
    access:"OPEN_INGEST",
    url:"https://www.epa.gov/water-research/epanet",
    topics:["hydraulic modelling","extended period simulation","water quality","pipes","junctions","pumps","valves","tanks","reservoirs","source tracing","water age"],
    notes:"Primary computational reference for pressurised drinking-water network simulation; ingestion must preserve provenance and version."
  },
  {
    id:"us-epa-distribution-resources",
    authority:"United States Environmental Protection Agency",
    title:"Drinking Water Distribution System Tools and Resources",
    era:"CURRENT",
    access:"OPEN_INGEST",
    url:"https://www.epa.gov/dwreginfo/drinking-water-distribution-system-tools-and-resources",
    topics:["pressure management","water loss","main breaks","storage","corrosion","biofilms","distribution water quality"],
    notes:"Operational and research resource family; ingest only materials whose individual rights permit it."
  },
  {
    id:"who-water-safety-distribution",
    authority:"World Health Organization",
    title:"Water safety in distribution systems",
    era:"MODERN",
    access:"REFERENCE_ONLY_UNLESS_LICENSED",
    url:"https://www.who.int/publications-detail-redirect/9789241548892",
    topics:["distribution risk","operation","maintenance","water quality","risk assessment"],
    notes:"Authoritative safety reference. Respect publication licence/permissions."
  },
  {
    id:"who-wsp-2023",
    authority:"World Health Organization",
    title:"Water safety plan manual, second edition",
    era:"CURRENT",
    access:"REFERENCE_ONLY_UNLESS_LICENSED",
    url:"https://www.who.int/publications/i/item/9789240067691",
    topics:["risk management","operational monitoring","improvement planning","climate resilience"],
    notes:"CC BY-NC-SA 3.0 IGO for non-commercial uses; commercial Pantavion use requires permission/licensing review."
  },
  {
    id:"awwa-manuals-standards",
    authority:"American Water Works Association",
    title:"AWWA Standards and Manuals of Water Supply Practices",
    era:"CURRENT",
    access:"REFERENCE_ONLY_UNLESS_LICENSED",
    url:"https://www.awwa.org/standards/",
    topics:["distribution","valves","pipes","tanks","operations","utility practice","materials","installation"],
    notes:"Catalog and metadata may be referenced; full protected standards/manuals require proper licensed access."
  },
];

export const PANTAVION_WATER_ENGINEERING_GOVERNANCE = {
  authenticNetworkWriteAllowed:false,
  simulationsMustUseScenarioLayer:true,
  calculationsMustExposeInputsAssumptionsAndUnits:true,
  recommendationsMustPreserveSourceNetwork:true,
  sourceProvenanceRequired:true,
  licensedContentMustNotBeCopiedWithoutRights:true,
  fieldMeasurementsOverrideGenericAssumptionsWhenValidated:true,
} as const;
