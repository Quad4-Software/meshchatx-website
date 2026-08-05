@php
    $page = 'error';
    $status = 401;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="401" />
@endsection
