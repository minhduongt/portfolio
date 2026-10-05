Set(varMachineType, ThisItem.Name);
    Set(LoadingSpinnerImage, true);

    Set(
        varSelectedRecordType,
        Switch(
            varMachineType,
            "Travelift",  'record type'.Travelift,
            "Translift",  'record type'.Translift,
            "Taylor",     'record type'.Taylor,
            "Terberg",    'record type'.Terberg,
            "Strongback", 'record type'.Strongback,
            "Monobeam",   'record type'.Monobeam
        )
    );

    Set(
        HeaderDraftRecordType,
        Filter(
            'S&S TL Header Drafts',
            'Record Type' = varSelectedRecordType And 'Approval Status' = 'approval status'.InProgress
        )
    );
     
    Set(
        menuItems,
        Switch(
            varMachineType,
            "Travelift",
                Table(
                    {Label: "Home",               Screen: sc_LandingHome},
                    {Label: "Header",             Screen: sc_Header},
                    {Label: "Customer Info",      Screen: sc_CustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_ShippingAndErections},
                    {Label: "Publications",       Screen: sc_Publications},
                    {Label: "Machine Specs",      Screen: sc_MachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_OptionalRequirement},
                    {Label: "Revisions",          Screen: sc_Revision},
                    {Label: "Print",              Screen: sc_TraveliftReport}
                ),
            "Translift",
                Table(
                    {Label: "Home",               Screen: sc_LandingHome},
                    {Label: "Header",             Screen: sc_Header},
                    {Label: "Customer Info",      Screen: sc_CustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_TransliftShippingAndErections},
                    {Label: "Publications",       Screen: sc_TransliftPublications},
                    {Label: "Machine Specs",      Screen: sc_TransliftMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_OptionalRequirement},
                    {Label: "Revisions",          Screen: sc_Revision},
                    {Label: "Print",              Screen: sc_TransliftReport}
                ),
            "Taylor",
                Table(
                    {Label: "Home",               Screen: sc_LandingHome},
                    {Label: "Header",             Screen: sc_TaylorHeader},
                    {Label: "Customer Info",      Screen: sc_CustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_TaylorShippingAndErections},
                    {Label: "Publications",       Screen: sc_Publications},
                    {Label: "Machine Specs",      Screen: sc_TaylorMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_OptionalRequirement},
                    {Label: "Revisions",          Screen: sc_Revision},
                    {Label: "Print",              Screen: sc_TaylorReport}
                ),
            "Terberg",
                Table(
                    {Label: "Home",               Screen: sc_LandingHome},
                    {Label: "Header",             Screen: sc_TerbergHeader},
                    {Label: "Customer Info",      Screen: sc_CustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_TerbergShippingAndErections},
                    {Label: "Publications",       Screen: sc_Publications},
                    {Label: "Machine Specs",      Screen: sc_TerbergMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_OptionalRequirement},
                    {Label: "Revisions",          Screen: sc_Revision},
                    {Label: "Print",              Screen: sc_TerbergReport}
                ),
            "Strongback",
                Table(
                    {Label: "Home",               Screen: sc_LandingHome},
                    {Label: "Header",             Screen: sc_Header},
                    {Label: "Customer Info",      Screen: sc_CustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_ShippingAndErections},
                    {Label: "Publications",       Screen: sc_Publications},
                    {Label: "Machine Specs",      Screen: sc_MachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_OptionalRequirement},
                    {Label: "Revisions",          Screen: sc_Revision},
                    {Label: "Print",              Screen: sc_TraveliftReport}
                ),
            "Monobeam",
                Table(
                    {Label: "Home",               Screen: sc_LandingHome},
                    {Label: "Header",             Screen: sc_Header},
                    {Label: "Customer Info",      Screen: sc_CustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_ShippingAndErections},
                    {Label: "Publications",       Screen: sc_Publications},
                    {Label: "Machine Specs",      Screen: sc_MachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_OptionalRequirement},
                    {Label: "Revisions",          Screen: sc_Revision},
                    {Label: "Print",              Screen: sc_TraveliftReport}
                )
        )
    );

    Set(
        menuDraftItems,
        Switch(
            varMachineType,
            "Travelift",
                Table(
                    {Label: "Home",               Screen: sc_Header},
                    {Label: "Header",             Screen: sc_HeaderDraft},
                    {Label: "Customer Info",      Screen: sc_DraftCustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_DraftShippingAndErections},
                    {Label: "Publications",       Screen: sc_PublicationsDraft},
                    {Label: "Machine Specs",      Screen: sc_DraftMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_DraftOptionalRequirement}
                ),
            "Translift",
                Table(
                    {Label: "Home",               Screen: sc_Header},
                    {Label: "Header",             Screen: sc_HeaderDraft},
                    {Label: "Customer Info",      Screen: sc_DraftCustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_TransliftDraftShippingAndErections},
                    {Label: "Publications",       Screen: sc_TransfiftPublicationsDraft},
                    {Label: "Machine Specs",      Screen: sc_DraftTransliftMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_DraftOptionalRequirement}
                ),
            "Taylor",
                Table(
                    {Label: "Home",               Screen: sc_TaylorHeader},
                    {Label: "Header",             Screen: sc_TaylorDraftHeader},
                    {Label: "Customer Info",      Screen: sc_DraftCustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_TaylorDraftShippingAndErections},
                    {Label: "Publications",       Screen: sc_PublicationsDraft},
                    {Label: "Machine Specs",      Screen: sc_DraftTaylorMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_DraftOptionalRequirement}
                ),
            "Terberg",
                Table(
                    {Label: "Home",               Screen: sc_TerbergHeader},
                    {Label: "Header",             Screen: sc_TerbergDraftHeader},
                    {Label: "Customer Info",      Screen: sc_DraftCustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_TerbergDraftShippingAndErections},
                    {Label: "Publications",       Screen: sc_PublicationsDraft},
                    {Label: "Machine Specs",      Screen: sc_DraftTerbergMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_DraftOptionalRequirement}
                ),
            "Strongback",
                Table(
                    {Label: "Home",               Screen: sc_Header},
                    {Label: "Header",             Screen: sc_HeaderDraft},
                    {Label: "Customer Info",      Screen: sc_DraftCustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_DraftShippingAndErections},
                    {Label: "Publications",       Screen: sc_PublicationsDraft},
                    {Label: "Machine Specs",      Screen: sc_DraftMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_DraftOptionalRequirement}
                ),
            "Monobeam",
                Table(
                    {Label: "Home",               Screen: sc_Header},
                    {Label: "Header",             Screen: sc_HeaderDraft},
                    {Label: "Customer Info",      Screen: sc_DraftCustomerInfo},
                    {Label: "Shipping/Erections", Screen: sc_DraftShippingAndErections},
                    {Label: "Publications",       Screen: sc_PublicationsDraft},
                    {Label: "Machine Specs",      Screen: sc_DraftMachineSpecs},
                    {Label: "Optional Equipment", Screen: sc_DraftOptionalRequirement}
                )
        )
    );

    Set(
        fullViewMenuItems,
        Table(
            {Label: "Home",      Screen: sc_LandingHome},
            {Label: "Form",      Screen: sc_FullViewForm},
            {Label: "Revisions", Screen: sc_Revision},
            {
                Label: "Print",
                Screen:
                    Switch(
                        varMachineType,
                        "Travelift",  sc_TraveliftReport,
                        "Translift",  sc_TransliftReport,
                        "Taylor",     sc_TaylorReport,
                        "Terberg",    sc_TerbergReport,
                        "Strongback", sc_TraveliftReport,
                        "Monobeam",   sc_TraveliftReport
                    )
            }
        )
    );

    Set(
        fullViewMenuDraftItems,
        Table(
            {Label: "Home", Screen: sc_FullViewForm},
            {Label: "Form", Screen: sc_FullViewDraftForm}
        )
    );

    Set(varPage, 1);
    Set(varPendingPage, 1);
    Set(LoadingSpinnerImage, false);
    Navigate(sc_PendingApproval);
      